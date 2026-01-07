# semantic_service.py
import json, torch, requests
from collections import Counter
from typing import List, Dict, Tuple

from sklearn.cluster import KMeans
from sentence_transformers import SentenceTransformer, util

from huggingface_hub import snapshot_download

MODEL = SentenceTransformer("./models/all-mpnet-base-v2")

with open("Pre_encode/domain_vectors.json", encoding="utf8") as f:
    _raw = json.load(f)
DOMAIN_NAMES = list(_raw.keys())
DOMAIN_VECS  = torch.tensor(list(_raw.values()), dtype=torch.float32)  # (N,768)


def query_openalex_top_concepts(term: str,
                                max_works: int = 50,
                                top_k: int = 5) -> List[Tuple[str, float]]:
    url = f"https://api.openalex.org/works?search={term}&per-page={max_works}"
    data = requests.get(url, timeout=8).json()
    results = data.get("results", [])
    counter = Counter()
    for w in results:
        for c in w.get("concepts", []):
            counter[c["display_name"]] += c.get("score", 0.0)
    return counter.most_common(top_k)

def build_combined_vector(term: str,
                          tag_scores: List[Tuple[str, float]]) -> torch.Tensor:
    base_vec = MODEL.encode(term, convert_to_tensor=True)
    if not tag_scores:
        return base_vec
    tags, scores = zip(*tag_scores)
    tag_vecs = MODEL.encode(list(tags), convert_to_tensor=True)        # (k,768)
    scores_t = torch.tensor(scores).unsqueeze(1)                       # (k,1)
    weighted_sum = (tag_vecs * scores_t).sum(dim=0) / scores_t.sum()
    combined = torch.nn.functional.normalize(base_vec + weighted_sum, p=2, dim=0)
    return combined

def kmeans_high_cluster(scores: Dict[str, float], k: int = 4) -> Dict[str, float]:
    if len(scores) <= k:
        return scores                                # too few samples, return as-is
    vals = torch.tensor(list(scores.values())).unsqueeze(1)
    km   = KMeans(n_clusters=k, n_init=10, random_state=42).fit(vals)
    centers = km.cluster_centers_.flatten()
    high_cluster = centers.argmax()
    sel = {
        name: round(float(v), 4)
        for (name, v), label in zip(scores.items(), km.labels_)
        if label == high_cluster
    }
    return sel

def semantic_pairing(term: str,
                    existing_nodes: List[str]) -> Dict[str, object]:
    tag_scores = query_openalex_top_concepts(term)

    combo_vec  = build_combined_vector(term, tag_scores)

    sim_domains   = util.cos_sim(combo_vec, DOMAIN_VECS)[0]
    domain_scores = {n: round(float(s), 4)
                     for n, s in zip(DOMAIN_NAMES, sim_domains)}
    domain_high = kmeans_high_cluster(domain_scores, k=4)

    if not existing_nodes:
        return {
            "result":           "domain_only",
            "matched_node":     None,
            "node_score":       None,
            "matched_domains":  domain_high
        }

    node_vecs   = MODEL.encode(existing_nodes, convert_to_tensor=True)
    sim_nodes   = util.cos_sim(combo_vec, node_vecs)[0]
    node_scores = {n: round(float(s), 4) for n, s in zip(existing_nodes, sim_nodes)}
    best_node_name, best_node_score = max(node_scores.items(), key=lambda x: x[1])

    best_domain_score = max(domain_high.values()) if domain_high else 0.0
    if best_node_score >= best_domain_score:
        return {
            "result":           "existing_node",
            "matched_node":     best_node_name,
            "node_score":       round(best_node_score, 4),
            "matched_domains":  {}
        }
    else:
        return {
            "result":           "domain_first",
            "matched_node":     best_node_name,
            "node_score":       round(best_node_score, 4),
            "matched_domains":  domain_high
        }



