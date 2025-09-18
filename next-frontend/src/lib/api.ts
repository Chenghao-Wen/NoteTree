import axios from "axios";
type FetchOptions = {
  method?: string;
  data?: any;
  headers?: Record<string, string>;
};

export const fetchWithAuth = async (
  url: string,
  options: FetchOptions = {}
) => {
  const token = localStorage.getItem("token");

  const instance = axios.create({
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const method = options.method?.toLowerCase() || "get";

  if (method === "get") {
    return instance.get(url);
  } else if (method === "post") {
    return instance.post(url, options.data);
  }

  // You can add more methods as needed, such as put, delete
};
