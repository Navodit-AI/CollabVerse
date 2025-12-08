"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL; // ✅ Render backend URL

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("projects");
  const [loading, setLoading] = useState(true);

  const [posts, setPosts] = useState([]);
  const [peers, setPeers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });

  const [postSearch, setPostSearch] = useState("");
  const [postDomain, setPostDomain] = useState("All");

  const [peerSearch, setPeerSearch] = useState("");
  const [peerRole, setPeerRole] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    description: "",
    domain: "Web",
    skills: ""
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    fetchData();
  }, [activeTab, meta.page, postSearch, postDomain, peerSearch, peerRole]);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      const query = new URLSearchParams({ page: meta.page, limit: 6 });

      if (activeTab === "projects") {
        if (postSearch) query.append("search", postSearch);
        if (postDomain !== "All") query.append("domain", postDomain);

        const res = await fetch(`${API}/api/posts?${query}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setPosts(data.data || []);
          setMeta(prev => ({ ...prev, ...data.meta }));
        }

      } else if (activeTab === "peers") {
        if (peerSearch) query.append("search", peerSearch);
        if (peerRole !== "All") query.append("role", peerRole);

        const res = await fetch(`${API}/api/users?${query}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setPeers(data.data || []);
          setMeta(prev => ({ ...prev, ...data.meta }));
        }
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleCreatePost = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newPost,
          skills: newPost.skills.split(",").map(s => s.trim())
        })
      });

      if (res.ok) {
        setShowModal(false);
        setNewPost({ title: "", description: "", domain: "Web", skills: "" });

        if (activeTab === "projects") fetchData();
        else setActiveTab("projects");

      } else {
        const data = await res.json();
        alert(data.message || "Failed to create post.");
      }

    } catch {
      alert("Error creating post");
    }
  };

  if (!user && loading) return <p className="text-white p-10">Loading...</p>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">

      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
          CollabVerse
        </h1>
        <div className="flex gap-4 items-center">
          <span className="text-gray-400">Hi, {user.name}</span>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300">
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-8 border-b border-gray-800 pb-2">
        <button
          onClick={() => { setActiveTab("projects"); setMeta({ page: 1, totalPages: 1 }); }}
          className={`text-lg font-medium pb-2 ${activeTab === "projects" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-500"}`}
        >
          Find Projects
        </button>

        <button
          onClick={() => { setActiveTab("peers"); setMeta({ page: 1, totalPages: 1 }); }}
          className={`text-lg font-medium pb-2 ${activeTab === "peers" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-500"}`}
        >
          Find Peers
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
        <input
          placeholder={activeTab === "projects" ? "Search Projects..." : "Search People..."}
          className="flex-1 bg-black border border-gray-700 p-2 rounded text-white"
          value={activeTab === "projects" ? postSearch : peerSearch}
          onChange={(e) =>
            activeTab === "projects" ? setPostSearch(e.target.value) : setPeerSearch(e.target.value)
          }
        />

        {activeTab === "projects" ? (
          <select
            className="bg-black border border-gray-700 p-2 rounded text-white"
            value={postDomain}
            onChange={(e) => setPostDomain(e.target.value)}
          >
            <option value="All">All Domains</option>
            <option value="Web">Web Dev</option>
            <option value="AI">AI/ML</option>
            <option value="Mobile">Mobile App</option>
          </select>
        ) : (
          <select
            className="bg-black border border-gray-700 p-2 rounded text-white"
            value={peerRole}
            onChange={(e) => setPeerRole(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="Developer">Developer</option>
            <option value="Designer">Designer</option>
            <option value="Manager">Manager</option>
          </select>
        )}

        {activeTab === "projects" && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded font-bold transition-all shadow-lg hover:shadow-blue-500/20"
          >
            + Post Idea
          </button>
        )}
      </div>

      {/* Content Grid */}
      {loading ? (
        <p className="text-gray-500">Loading data...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === "projects" &&
            posts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-900 border border-gray-800 p-6 rounded-xl hover:border-gray-700 transition-all hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{post.title}</h3>
                  <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">
                    {post.domain}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-6 h-20 overflow-hidden">
                  {post.description}
                </p>
                <div className="flex justify-between items-center text-sm border-t border-gray-800 pt-4 text-gray-500">
                  <span>By {post.author.name}</span>
                  <span className={`${post.status === "Open" ? "text-green-400" : "text-red-400"}`}>
                    {post.status}
                  </span>
                </div>
              </div>
            ))}

          {activeTab === "peers" &&
            peers.map((peer) => (
              <div
                key={peer.id}
                className="bg-gray-900 border border-gray-800 p-6 rounded-xl hover:border-gray-700 transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center font-bold text-xl">
                    {peer.name[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{peer.name}</h3>
                    <p className="text-gray-400 text-sm">{peer.role}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {peer.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center mt-10 gap-4">
          <button
            disabled={meta.page <= 1}
            onClick={() => setMeta((p) => ({ ...p, page: p.page - 1 }))}
            className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="py-2 text-gray-500">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            disabled={meta.page >= meta.totalPages}
            onClick={() => setMeta((p) => ({ ...p, page: p.page + 1 }))}
            className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-lg border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Start a Project</h2>
            <input
              className="w-full bg-black border border-gray-800 p-3 rounded mb-4 focus:border-blue-500 outline-none"
              placeholder="Project Title"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            />
            <div className="flex gap-4 mb-4">
              <select
                className="flex-1 bg-black border border-gray-800 p-3 rounded"
                value={newPost.domain}
                onChange={(e) => setNewPost({ ...newPost, domain: e.target.value })}
              >
                <option value="Web">Web Development</option>
                <option value="AI">AI/Machine Learning</option>
                <option value="Mobile">Mobile Apps</option>
                <option value="Game">Game Dev</option>
              </select>
            </div>
            <input
              className="w-full bg-black border border-gray-800 p-3 rounded mb-4 focus:border-blue-500 outline-none"
              placeholder="Required Skills (e.g. React, Python)"
              value={newPost.skills}
              onChange={(e) => setNewPost({ ...newPost, skills: e.target.value })}
            />
            <textarea
              className="w-full bg-black border border-gray-800 p-3 rounded mb-6 h-32 focus:border-blue-500 outline-none"
              placeholder="Describe your project..."
              value={newPost.description}
              onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
            />
            <div className="flex gap-3">
              <button
                onClick={handleCreatePost}
                className="flex-1 bg-blue-600 py-3 rounded font-bold hover:bg-blue-500"
              >
                Launch Project
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-800 py-3 rounded font-bold hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
