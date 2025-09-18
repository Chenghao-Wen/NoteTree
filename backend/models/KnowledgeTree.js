// TreeTree.js
// -----------------------------------------------------------------------------
// A minimal tree helper for your MVP knowledge‑Tree prototype
// * Zero external deps except Node's `fs` / `path`
// * Designed around **System ➜ Domain ➜ files[]** two‑level structure
// * Easily extendable to deeper hierarchies later
// -----------------------------------------------------------------------------

const Tree = require("./treeSchema");

class KnowledgeTreeNode {
  constructor(name) {
    this.name = name; // string
    this.children = []; // KnowledgeTreeNode[]
    this.files = []; // string[] (relative file paths)
  }
  toJSON() {
    return {
      name: this.name,
      files: this.files,
      children: this.children.map((child) => child.toJSON()),
    };
  }
}

class KnowledgeTree {
  constructor(root = new KnowledgeTreeNode("root")) {
    this.root = root;
  }

  static async initUserTree(userId) {
    try {
      let TreeDoc = await Tree.findOne({ user_id: userId });

      if (!TreeDoc) {
        const emptyTree = {
          user_id: userId,
          root: new KnowledgeTreeNode("root").toJSON(),
        };
        TreeDoc = await Tree.create(emptyTree);
      }

      return this.fromJSON(TreeDoc.root);
    } catch (err) {
      throw new Error(`初始化用户图谱失败: ${err.message}`);
    }
  }
  toJSON() {
    return {
      root: this.root ? this.root.toJSON() : null,
    };
  }
  static fromJSON(jsonObj) {
    function build(nodeObj) {
      const node = new KnowledgeTreeNode(nodeObj.name);
      node.files = nodeObj.files || [];
      node.children = (nodeObj.children || []).map(build);
      return node;
    }
    return new KnowledgeTree(build(jsonObj));
  }

  static async loadFromDB(userId) {
    try {
      const treeDoc = await Tree.findOne({ user_id: userId });
      if (!treeDoc) {
        throw new Error(`用户 ${userId} 的树不存在`);
      }
      return this.fromJSON(treeDoc.root);
    } catch (err) {
      throw new Error(`加载树失败: ${err.message}`);
    }
  }

  async saveToDB(userId) {
    try {
      await Tree.findOneAndUpdate(
        { user_id: userId },
        { root: this.root.toJSON() },
        { upsert: true } // 不存在则创建
      );
    } catch (err) {
      throw new Error(`保存树失败: ${err.message}`);
    }
  }

  listNodes() {
    const out = [];
    (function dfs(node, level) {
      out.push({ name: node.name, level });
      node.children.forEach((child) => dfs(child, level + 1));
    })(this.root, 0);
    return out;
  }

  _findNode(name) {
    let ref = null;
    (function dfs(node) {
      if (ref) return;
      if (node.name === name) {
        ref = node;
        return;
      }
      node.children.forEach(dfs);
    })(this.root);
    return ref;
  }
  addChild(parentName, childName, filePath) {
    const parent = this._findNode(parentName);
    if (!parent) throw new Error(`Parent node '${parentName}' not found.`);
    if (parent.children.some((c) => c.name === childName)) return; // already exists
    const newNode = new KnowledgeTreeNode(childName);
    newNode.files.push(filePath);
    parent.children.push(newNode);
  }

  removeChild(parentName, childName) {
    const parent = this._findNode(parentName);
    if (!parent) throw new Error(`Parent node '${parentName}' not found.`);
    const idx = parent.children.findIndex((c) => c.name === childName);
    if (idx === -1)
      throw new Error(`Child '${childName}' not found under '${parentName}'.`);
    parent.children.splice(idx, 1);
  }

  moveNode(childName, newParentName) {
    let parentOfChild = null;
    let childRef = null;
    (function dfs(node) {
      node.children.forEach((c) => {
        if (c.name === childName) {
          parentOfChild = node;
          childRef = c;
        }
        dfs(c);
      });
    })(this.root);

    if (!childRef || !parentOfChild)
      throw new Error(`Node '${childName}' not found.`);

    const newParent = this._findNode(newParentName);
    if (!newParent) throw new Error(`New parent '${newParentName}' not found.`);
    parentOfChild.children = parentOfChild.children.filter(
      (c) => c !== childRef
    );
    newParent.children.push(childRef);
  }
}

module.exports = KnowledgeTree;
