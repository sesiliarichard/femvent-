"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Status = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
    const [status, setStatus] = useState<Status>("checking");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
            const query = new URLSearchParams(window.location.search);

            // Expired or already-used link
            if (hash.get("error") || query.get("error")) {
                if (!cancelled) setStatus("invalid");
                return;
            }

            // The link brings recovery tokens in the address bar
            const accessToken = hash.get("access_token");
            const refreshToken = hash.get("refresh_token");
            if (accessToken && refreshToken && hash.get("type") === "recovery") {
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });
                window.history.replaceState(null, "", window.location.pathname);
                if (!cancelled) setStatus(sessionError ? "invalid" : "ready");
                return;
            }

            // The Supabase client may already have consumed the tokens itself.
            // Only accept a session if a reset email was requested in the last hour,
            // so someone who is simply logged in can't reach this form.
            const { data } = await supabase.auth.getSession();
            const sentAt = data.session?.user?.recovery_sent_at;
            const recent = sentAt ? Date.now() - new Date(sentAt).getTime() < 60 * 60 * 1000 : false;
            if (!cancelled) setStatus(recent ? "ready" : "invalid");
        };

        init();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        if (password !== confirm) {
            setError("The two passwords don't match.");
            return;
        }

        setSaving(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) {
            setError(updateError.message || "Could not update your password. Please request a new link.");
            setSaving(false);
            return;
        }

        // Sign out everywhere so any old sessions stop working
        await supabase.auth.signOut({ scope: "global" });
        setStatus("done");
        setSaving(false);
    };

    if (status === "checking") {
        return (
            <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-32 text-center">
                <p className="text-[#8A7A97]">Checking your link...</p>
            </main>
        );
    }

    if (status === "invalid") {
        return (
            <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-32 text-center">
                <h1 className="text-2xl font-bold text-[#2E1F45]">This link has expired</h1>
                <p className="text-sm text-[#5C4A6B]">
                    Reset links work once and expire after an hour. Open the FemVents app, tap
                    "Forgot password?" and we'll send you a new one.
                </p>
            </main>
        );
    }

    if (status === "done") {
        return (
            <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-32 text-center">
                <div className="text-5xl">✅</div>
                <h1 className="text-2xl font-bold text-[#2E1F45]">Password updated</h1>
                <p className="text-sm text-[#5C4A6B]">
                    Open the FemVents app and sign in with your new password.
                </p>
            </main>
        );
    }

    return (
        <main className="mx-auto flex max-w-md flex-col gap-6 px-6 pb-20 pt-16">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9B1F5C]">FemVents</p>
                <h1 className="mt-2 text-3xl font-bold text-[#2E1F45]">Choose a new password</h1>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-3xl border border-[#D9C9E0] bg-white p-6 shadow-lg">
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="New password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#D9C9E0] px-4 py-3 pr-12 text-sm"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#9B1F5C]"
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>
                <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full rounded-xl border border-[#D9C9E0] px-4 py-3 text-sm"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full bg-[#9B1F5C] px-6 py-3 text-sm font-semibold text-[#FBF3FA] shadow-lg transition-colors hover:bg-[#7A1745] disabled:opacity-60"
                >
                    {saving ? "Saving..." : "Save new password"}
                </button>
            </form>
        </main>
    );
}