import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Block = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  user_id: string;
  user_email: string;
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Fetch blocks for logged-in user
  async function fetchBlocks(userId: string) {
    const { data, error } = await supabase
      .from("silent_blocks")
      .select("*")
      .eq("user_id", userId)
      .order("start_time", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setBlocks(data || []);
    }
  }

  // Authentication handling
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
      if (data.user) fetchBlocks(data.user.id);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) fetchBlocks(session.user.id);
      if (!session?.user) setBlocks([]);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Login with magic link
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) return alert(error.message);
    alert("Check your email for a magic link.");
  }

  // Logout
  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  // Add new block
  async function addBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return alert("Log in first");

    const payload = {
      title,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      user_id: user.id,
      user_email: user.email,
    };

    const { error } = await supabase.from("silent_blocks").insert([payload]);
    if (error) {
      console.error(error);
      alert("Insert failed: " + error.message);
    } else {
      setTitle("");
      setStartTime("");
      setEndTime("");
      fetchBlocks(user.id);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Quiet Hours Scheduler</h1>

        {/* If user not logged in */}
        {!user ? (
          <form
            onSubmit={handleLogin}
            className="bg-white p-6 rounded shadow space-y-4"
          >
            <h2 className="text-lg">Sign in (magic link)</h2>
            <input
              className="w-full border p-2"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded">
              Send Magic Link
            </button>
          </form>
        ) : (
          <>
            {/* User info */}
            <div className="flex justify-between items-center mb-4">
              <div>
                Signed in as <strong>{user.email}</strong>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Sign out
              </button>
            </div>

            {/* Add block form */}
            <form
              onSubmit={addBlock}
              className="bg-white p-6 rounded shadow mb-6 space-y-3"
            >
              <h2 className="text-lg">Create Quiet Block</h2>
              <input
                className="w-full border p-2"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <input
                className="w-full border p-2"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
              <input
                className="w-full border p-2"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
              <button className="bg-green-600 text-white px-4 py-2 rounded">
                Create
              </button>
            </form>

            {/* List blocks */}
            <h2 className="text-lg mb-2">Your Blocks</h2>
            <ul className="space-y-2">
              {blocks.map((b) => (
                <li key={b.id} className="bg-white p-3 rounded shadow">
                  <div className="font-semibold">{b.title}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(b.start_time).toLocaleString()} →{" "}
                    {new Date(b.end_time).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}



