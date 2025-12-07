"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("teams"); // 'teams' or 'projects'
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Forms
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [newProject, setNewProject] = useState({ name: "", description: "", teamId: "" });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [activeTab]); // Refetch when switching tabs (simple cache invalidation)

  const fetchData = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      // Always fetch teams because Projects create form needs them
      const teamsRes = await fetch(`${apiUrl}/api/teams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const teamsData = await teamsRes.json();
      if (teamsRes.ok) setTeams(teamsData.data || []);

      if (activeTab === "projects") {
        const projectsRes = await fetch(`${apiUrl}/api/projects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const projectsData = await projectsRes.json();
        if (projectsRes.ok) setProjects(projectsData.data || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiUrl}/api/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newTeam)
      });

      const data = await res.json();

      if (res.ok) {
        setShowTeamModal(false);
        setNewTeam({ name: "", description: "" });
        fetchData(); // Refresh list
      } else {
        // Show detailed error if available
        alert(data.message + (data.error ? `\nDetails: ${data.error}` : ""));
      }
    } catch (err) {
      alert("Network or Server Error: " + err.message);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiUrl}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newProject)
      });

      const data = await res.json();

      if (res.ok) {
        setShowProjectModal(false);
        setNewProject({ name: "", description: "", teamId: "" });
        fetchData(); // Refresh list
      } else {
        alert(data.message + (data.error ? `\nDetails: ${data.error}` : ""));
      }
    } catch (err) {
      alert("Network or Server Error: " + err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          CollabVerse
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
            Logged in
          </span>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your teams and current projects.</p>
        </header>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-8">
          <button
            onClick={() => setActiveTab("teams")}
            className={`pb-4 px-2 text-lg font-medium transition-colors relative ${activeTab === "teams"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
          >
            Teams
            {activeTab === "teams" && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`pb-4 px-2 text-lg font-medium transition-colors relative ${activeTab === "projects"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
          >
            Projects
            {activeTab === "projects" && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></span>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Content Area */}
        <div>
          {/* Action Bar */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {activeTab === "teams" ? "Your Teams" : "Active Projects"}
            </h2>
            <button
              onClick={() => activeTab === "teams" ? setShowTeamModal(true) : setShowProjectModal(true)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 font-medium flex items-center gap-2"
            >
              <span>+</span> Create {activeTab === "teams" ? "Team" : "Project"}
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
              ))}
            </div>
          ) : (
            <>
              {activeTab === "teams" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teams.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                      No teams found. Create one to get started!
                    </div>
                  ) : (
                    teams.map((team) => (
                      <div key={team.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <h3 className="text-xl font-bold mb-2">{team.name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                          {team.description || "No description"}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-400 uppercase font-semibold tracking-wider">
                          <span>{team._count?.members || 1} Members</span>
                          <span>{team._count?.projects || 0} Projects</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "projects" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                      No projects found.
                    </div>
                  ) : (
                    projects.map((project) => (
                      <div key={project.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 rounded-full opacity-10 ${project.status === 'completed' ? 'bg-green-500' :
                          project.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-500'
                          }`}></div>

                        <h3 className="text-xl font-bold mb-1">{project.name}</h3>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full uppercase font-bold tracking-wide mb-3 ${project.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          project.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                          {project.status.replace('-', ' ')}
                        </span>

                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                          {project.description || "No description"}
                        </p>

                        <div className="flex items-center text-sm text-gray-500">
                          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                            {project.team?.name || "Unknown Team"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Create Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all">
            <h3 className="text-2xl font-bold mb-4">Create New Team</h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <input
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Team Name"
                value={newTeam.name}
                onChange={e => setNewTeam({ ...newTeam, name: e.target.value })}
                required
              />
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                placeholder="Description (Optional)"
                value={newTeam.description}
                onChange={e => setNewTeam({ ...newTeam, description: e.target.value })}
              />
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all">
            <h3 className="text-2xl font-bold mb-4">Start New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <input
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Project Name"
                value={newProject.name}
                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                required
              />
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                placeholder="Description"
                value={newProject.description}
                onChange={e => setNewProject({ ...newProject, description: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Assign to Team</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newProject.teamId}
                  onChange={e => setNewProject({ ...newProject, teamId: e.target.value })}
                  required
                >
                  <option value="">Select a Team...</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
