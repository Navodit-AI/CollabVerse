"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import Avatar from "@/components/Avatar";
import ChatWidget from "@/components/ChatWidget";
import PostFormModal from "@/components/PostFormModal";
import ProfileModal from "@/components/ProfileModal";
import PostDrawer from "@/components/PostDrawer";
import PostCard, { CardSkeleton, DOMAINS, PeerCard } from "@/components/PostCard";
import { ArrowIcon, LogoutIcon, PlusIcon, SearchIcon } from "@/components/Icons";
import { api, clearSession, getToken, saveUser } from "@/lib/api";
import useStoredUser from "@/lib/useStoredUser";

const PAGE_SIZE = 9;
const ROLES = ["Developer", "Designer", "Manager"];

const TABS = {
  projects: {
    label: "Projects",
    heading: <>Find a project worth <em className="text-tomato">building.</em></>,
    endpoint: "/api/posts",
    filterParam: "domain",
    filters: DOMAINS.map((d) => ({ value: d.value, label: d.label })),
    searchPlaceholder: "Search projects…",
    noun: ["project", "projects"],
  },
  peers: {
    label: "People",
    heading: <>Find your <em className="text-tomato">people.</em></>,
    endpoint: "/api/users",
    filterParam: "role",
    filters: ROLES.map((r) => ({ value: r, label: `${r}s` })),
    searchPlaceholder: "Search by name or skill…",
    noun: ["person", "people"],
  },
};

function useDebounced(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function Dashboard() {
  const router = useRouter();
  const user = useStoredUser();

  const [tab, setTab] = useState("projects");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const query = useDebounced(search.trim());
  const [mine, setMine] = useState(false); // projects tab: only my projects

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  // `loading` is derived: true until the response for the current request has landed.
  const requestKey = `${tab}|${page}|${query}|${filter}|${mine}|${reloadKey}`;
  const [loadedKey, setLoadedKey] = useState(null);
  const loading = loadedKey !== requestKey;

  // null = closed, "new" = create, a post object = edit that post
  const [postForm, setPostForm] = useState(null);
  // "welcome" right after signup (flag set by the signup page), "edit" from the nav, null when closed
  const [profileMode, setProfileMode] = useState(() =>
    typeof window !== "undefined" && sessionStorage.getItem("cv-welcome") ? "welcome" : null
  );
  const [openPostId, setOpenPostId] = useState(null);

  const config = TABS[tab];

  // Auth gate
  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    sessionStorage.removeItem("cv-welcome");
    // Refresh the stored user so role/skills are current (older sessions stored only id/name/email).
    api("/api/users/me").then(saveUser).catch(() => {});
  }, [router]);

  // Fetch the current tab. AbortController drops stale responses when filters change quickly.
  useEffect(() => {
    if (!getToken()) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ page, limit: PAGE_SIZE });
    if (query) params.set("search", query);
    if (filter !== "All") params.set(config.filterParam, filter);
    if (tab === "projects" && mine) params.set("mine", "1");

    api(`${config.endpoint}?${params}`, { signal: controller.signal })
      .then((data) => {
        setItems(data.data || []);
        setMeta({ total: data.meta?.total ?? 0, totalPages: Math.max(1, data.meta?.totalPages ?? 1) });
        setError("");
      })
      .catch((err) => !controller.signal.aborted && setError(err.message))
      .finally(() => !controller.signal.aborted && setLoadedKey(requestKey));
    return () => controller.abort();
  }, [config, tab, page, query, filter, mine, requestKey]);

  const switchTab = (next) => {
    if (next === tab) return;
    setTab(next);
    setSearch("");
    setFilter("All");
    setMine(false);
    setPage(1);
    setItems([]);
  };

  const logout = () => {
    clearSession();
    sessionStorage.removeItem("verse-chat");
    router.push("/login");
  };

  const updatePost = useCallback((id, fn) => setItems((list) => list.map((p) => (p.id === id ? fn(p) : p))), []);

  // Optimistic like: flip immediately, reconcile with the server's answer, roll back on failure.
  const toggleLike = useCallback(
    async (post) => {
      const wasLiked = post.likedByMe;
      const flip = (p, liked) => ({
        ...p,
        likedByMe: liked,
        _count: { ...p._count, likes: Math.max(0, (p._count?.likes ?? 0) + (liked === p.likedByMe ? 0 : liked ? 1 : -1)) },
      });
      updatePost(post.id, (p) => flip(p, !wasLiked));
      try {
        const { liked } = await api("/api/likes", { method: "POST", body: { postId: post.id } });
        updatePost(post.id, (p) => flip(p, liked));
      } catch (err) {
        updatePost(post.id, (p) => flip(p, wasLiked));
        setError(err.message);
      }
    },
    [updatePost]
  );

  // Server responses for a single post don't know about the viewer's like, so keep ours.
  const mergePost = useCallback(
    (saved) => updatePost(saved.id, (p) => ({ ...p, ...saved, likedByMe: p.likedByMe })),
    [updatePost]
  );

  const setPostStatus = useCallback(
    async (post, status) => mergePost(await api(`/api/posts/${post.id}`, { method: "PUT", body: { status } })),
    [mergePost]
  );

  const deletePost = useCallback(async (post) => {
    await api(`/api/posts/${post.id}`, { method: "DELETE" });
    setOpenPostId(null);
    setItems((list) => list.filter((p) => p.id !== post.id));
    setMeta((m) => ({ ...m, total: Math.max(0, m.total - 1) }));
  }, []);

  const changeCommentCount = useCallback(
    (id, delta) => updatePost(id, (p) => ({ ...p, _count: { ...p._count, comments: Math.max(0, (p._count?.comments ?? 0) + delta) } })),
    [updatePost]
  );

  if (!user) return <div className="min-h-screen" />;

  const openPost = tab === "projects" ? items.find((p) => p.id === openPostId) : null;
  const [singular, plural] = config.noun;

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Logo href="/dashboard" />

          <nav aria-label="Sections" className="hidden sm:flex rounded-full border border-line bg-card p-1">
            {Object.entries(TABS).map(([key, t]) => (
              <button key={key} type="button" onClick={() => switchTab(key)} aria-current={tab === key ? "page" : undefined}
                className={`rounded-full px-5 py-1.5 text-sm font-medium transition-all duration-300 ${
                  tab === key ? "bg-ink text-paper" : "text-muted hover:text-ink"
                }`}>
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setProfileMode("edit")} aria-label="Edit your profile"
              className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1 text-sm text-ink-2 transition-colors hover:bg-field hover:text-ink md:pr-3">
              <Avatar name={user.name} size={30} />
              <span className="hidden md:inline">{user.name}</span>
            </button>
            <button type="button" onClick={logout} className="btn-quiet inline-flex items-center gap-1.5 rounded-full text-sm" aria-label="Log out">
              <LogoutIcon size={16} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <nav aria-label="Sections" className="flex border-t border-line/70 sm:hidden">
          {Object.entries(TABS).map(([key, t]) => (
            <button key={key} type="button" onClick={() => switchTab(key)} aria-current={tab === key ? "page" : undefined}
              className={`flex-1 py-2.5 text-sm font-medium ${tab === key ? "text-ink shadow-[inset_0_-2px_0_var(--color-tomato)]" : "text-faint"}`}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-32 pt-12 sm:px-8 sm:pt-16">
        {/* Heading */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div key={tab} className="animate-rise">
            <p className="eyebrow mb-4">
              {loading ? "Loading…" : `${meta.total} ${meta.total === 1 ? singular : plural}`}
            </p>
            <h1 className="display text-5xl sm:text-6xl lg:text-7xl max-w-3xl">{config.heading}</h1>
          </div>
          {tab === "projects" && (
            <button type="button" onClick={() => setPostForm("new")} className="btn btn-primary self-start py-3 md:self-auto">
              <PlusIcon size={18} /> Post an idea
            </button>
          )}
        </div>

        {/* Profile nudge: without skills, nobody can find you and Verse can't match you */}
        {!user.skills?.length && (
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-sage bg-sage-soft/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between animate-rise">
            <p className="text-sm text-ink-2">
              <span className="font-semibold text-ink">Add your role and skills</span> so teammates can find you and Verse can match you with projects.
            </p>
            <button type="button" onClick={() => setProfileMode("edit")} className="btn btn-primary shrink-0 py-2 text-sm">Complete profile</button>
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1 lg:max-w-md">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
            <label htmlFor="search" className="sr-only">{config.searchPlaceholder}</label>
            <input id="search" type="search" className="field rounded-full pl-11" placeholder={config.searchPlaceholder}
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter">
            {[{ value: "All", label: "All" }, ...config.filters].map((f) => (
              <button key={f.value} type="button" aria-pressed={filter === f.value}
                onClick={() => { setFilter(f.value); setPage(1); }}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  filter === f.value ? "border-ink bg-ink text-paper" : "border-line text-muted hover:border-line-strong hover:text-ink"
                }`}>
                {f.label}
              </button>
            ))}
            {tab === "projects" && (
              <button type="button" aria-pressed={mine} onClick={() => { setMine((m) => !m); setPage(1); }}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 sm:ml-2 ${
                  mine ? "border-tomato bg-tomato text-on-tomato" : "border-line text-muted hover:border-line-strong hover:text-ink"
                }`}>
                My projects
              </button>
            )}
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-danger/30 bg-danger/10 px-5 py-4 text-sm text-danger">
            <span>{error}</span>
            <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="font-semibold underline underline-offset-4">Retry</button>
          </div>
        )}

        {/* Grid */}
        {loading && items.length === 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : items.length === 0 && !error ? (
          <div className="card flex flex-col items-center px-6 py-20 text-center">
            <p className="display mb-3 text-4xl">Nothing here <em className="text-tomato">yet.</em></p>
            <p className="mb-8 max-w-sm text-muted">
              {mine && !query && filter === "All"
                ? "You haven't posted a project yet."
                : query || filter !== "All" || mine
                ? "No matches for that search. Try a different word or filter."
                : tab === "projects" ? "Be the first: post the idea you keep thinking about." : "No one else has joined yet. Invite a friend!"}
            </p>
            {tab === "projects" && !query && filter === "All" && (
              <button type="button" onClick={() => setPostForm("new")} className="btn btn-primary"><PlusIcon size={18} /> Post an idea</button>
            )}
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 transition-opacity ${loading ? "opacity-50" : ""}`}>
            {tab === "projects"
              ? items.map((post, i) => (
                  <PostCard key={post.id} post={post} index={i} onToggleLike={toggleLike} onOpen={() => setOpenPostId(post.id)} />
                ))
              : items.map((peer, i) => <PeerCard key={peer.id} peer={peer} index={i} />)}
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-3">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} className="btn btn-ghost">
              <ArrowIcon size={16} className="rotate-180" /> Prev
            </button>
            <span className="px-3 font-mono text-sm text-muted tabular-nums">{page} / {meta.totalPages}</span>
            <button type="button" disabled={page >= meta.totalPages || loading} onClick={() => setPage((p) => p + 1)} className="btn btn-ghost">
              Next <ArrowIcon size={16} />
            </button>
          </nav>
        )}
      </main>

      <PostFormModal
        key={`post-form-${postForm ? postForm.id ?? "new" : "closed"}`}
        open={Boolean(postForm)}
        post={postForm === "new" ? null : postForm}
        onClose={() => {
          if (postForm && postForm !== "new") setOpenPostId(postForm.id); // back to the drawer
          setPostForm(null);
        }}
        onSaved={(saved) => {
          if (postForm !== "new") {
            mergePost(saved);
            setOpenPostId(saved.id);
          } else {
            setSearch("");
            setFilter("All");
            setPage(1);
            setReloadKey((k) => k + 1);
          }
          setPostForm(null);
        }}
      />

      <ProfileModal
        key={`profile-${profileMode ?? "closed"}`}
        open={Boolean(profileMode)}
        welcome={profileMode === "welcome"}
        user={user}
        onClose={() => setProfileMode(null)}
        onSaved={() => tab === "peers" && setReloadKey((k) => k + 1)}
      />

      <PostDrawer
        key={`drawer-${openPostId ?? "none"}`}
        post={openPost}
        user={user}
        onClose={() => setOpenPostId(null)}
        onToggleLike={toggleLike}
        onCommentCountChange={changeCommentCount}
        onEdit={(post) => {
          // Only one overlay at a time: hide the drawer while editing, reopen it after saving.
          setOpenPostId(null);
          setPostForm(post);
        }}
        onSetStatus={setPostStatus}
        onDelete={deletePost}
        onPendingChange={(id, delta) =>
          updatePost(id, (p) => ({ ...p, pendingRequests: Math.max(0, (p.pendingRequests ?? 0) + delta) }))
        }
      />

      <ChatWidget />
    </div>
  );
}
