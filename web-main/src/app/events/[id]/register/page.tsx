"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface PriceOption {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency?: string;
    isAvailable?: boolean;
}

interface EventSummary {
    id: string;
    title: string;
    price: number;
    currency?: string;
}

type AuthMode = "login" | "signup";

export default function RegisterPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [event, setEvent] = useState<EventSummary | null>(null);
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [ticketTypes, setTicketTypes] = useState<PriceOption[]>([]);
    const [hostHasPayout, setHostHasPayout] = useState<boolean | null>(null);
    const [hostMethods, setHostMethods] = useState<Array<{ provider: string; instructions?: any }>>([]);

    const [session, setSession] = useState<any>(null);
    const [authMode, setAuthMode] = useState<AuthMode>("login");
    const [authEmail, setAuthEmail] = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [authName, setAuthName] = useState("");
    const [authError, setAuthError] = useState("");
    const [authLoading, setAuthLoading] = useState(false);

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [organization, setOrganization] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [country, setCountry] = useState("");
    const [dietary, setDietary] = useState("");
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [success, setSuccess] = useState(false);
    const [pendingOrder, setPendingOrder] = useState<{ reference: string; instructions: any; provider: string } | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const [azamPhone, setAzamPhone] = useState("");
    const [azamProvider, setAzamProvider] = useState("Mpesa");
    const [azamStatus, setAzamStatus] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session));
        const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
        return () => listener.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        (async () => {
            const { data } = await supabase
                .from("events")
                .select("id, title, price, currency, host_id")
                .eq("id", id)
                .single();
            setEvent(data);

            if (data?.id) {
                try {
                    const methodsRes = await fetch(`${process.env.NEXT_PUBLIC_HOST_APP_URL}/api/payments/available-methods?eventId=${data.id}`);
                    if (methodsRes.ok) {
                        const { methods } = await methodsRes.json();
                        setHostMethods(Array.isArray(methods) ? methods : []);
                        setHostHasPayout(Array.isArray(methods) && methods.length > 0);
                    } else {
                        setHostHasPayout(false);
                    }
                } catch {
                    setHostHasPayout(false);
                }
            }

            const { data: tiers } = await supabase
                .from("ticket_types")
                .select("id, name, description, price, currency")
                .eq("event_id", id)
                .eq("is_active", true)
                .order("sort_order", { ascending: true });

            if (tiers && tiers.length > 0) {
                setTicketTypes(tiers);
            } else {
                // Fallback for events with no configured tiers yet
                setTicketTypes([
                    {
                        id: "general",
                        name: "General Admission",
                        price: data?.price || 0,
                        currency: data?.currency || "USD",
                    },
                ]);
            }

            setLoadingEvent(false);
        })();
    }, [id]);

    const ticketOptions = ticketTypes;
    const selectedTicket = ticketOptions.find((t) => t.id === selectedTicketId) || ticketOptions[0];

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError("");
        setAuthLoading(true);
        try {
            if (authMode === "signup") {
                const { data, error } = await supabase.auth.signUp({
                    email: authEmail,
                    password: authPassword,
                });
                if (error) throw error;
                if (data.user) {
                    await supabase.from("users").insert({
                        id: data.user.id,
                        name: authName,
                        email: authEmail,
                        role: "attendee",
                        status: "active",
                    });
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: authEmail,
                    password: authPassword,
                });
                if (error) throw error;
            }
        } catch (err: any) {
            setAuthError(err.message || "Authentication failed");
        } finally {
            setAuthLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user) return;
        setSubmitError("");
        setSubmitting(true);

        try {
            const { error: profileError } = await supabase
                .from("users")
                .update({
                    name: fullName,
                    phone,
                    company: organization,
                    job_title: jobTitle,
                })
                .eq("id", session.user.id);
            if (profileError) throw profileError;

            if (selectedTicket.price > 0) {
                if (!hostHasPayout) {
                    setSubmitError(
                        "This host hasn't finished setting up payment collection yet, so paid tickets aren't available right now. Please check back soon or contact the organizer."
                    );
                    setSubmitting(false);
                    return;
                }

                if (!selectedPaymentMethod) {
                    setSubmitError("Please choose a payment method.");
                    setSubmitting(false);
                    return;
                }

                if (selectedPaymentMethod === "azampay") {
                    // AzamPay has its own dedicated form/button below — nothing to do here
                    setSubmitting(false);
                    return;
                }

                if (selectedPaymentMethod === "flutterwave") {
                    // Paid tier — send to Flutterwave, ticket gets created by the webhook after payment
                    const res = await fetch("/api/payments/create-checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            eventId: id,
                            amount: selectedTicket.price,
                            email: session.user.email,
                            name: fullName,
                            userId: session.user.id,
                            ticketTypeName: selectedTicket.name,
                        }),
                    });

                    const data = await res.json();
                    if (!res.ok || !data.sessionUrl) {
                        throw new Error(data.error || "Failed to start payment");
                    }

                    window.location.href = data.sessionUrl;
                    return;
                }

                if (selectedPaymentMethod === "crypto") {
                    // Crypto — hosted NOWPayments checkout, auto-confirmed via webhook
                    const cryptoRes = await fetch(
                        `${process.env.NEXT_PUBLIC_HOST_APP_URL}/api/payments/create-crypto-checkout`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                eventId: id,
                                amount: selectedTicket.price,
                                email: session.user.email,
                                name: fullName,
                                userId: session.user.id,
                                ticketTypeName: selectedTicket.name,
                            }),
                        }
                    );

                    const cryptoData = await cryptoRes.json();
                    if (!cryptoRes.ok || !cryptoData.sessionUrl) {
                        throw new Error(cryptoData.error || "Failed to start payment");
                    }

                    window.location.href = cryptoData.sessionUrl;
                    return;
                }

                if (["wise", "manual"].includes(selectedPaymentMethod)) {
                    const pendingRes = await fetch(
                        `${process.env.NEXT_PUBLIC_HOST_APP_URL}/api/payments/create-pending-order`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                eventId: id,
                                provider: selectedPaymentMethod,
                                amount: selectedTicket.price,
                                userId: session.user.id,
                            }),
                        }
                    );

                    const pendingData = await pendingRes.json();
                    if (!pendingRes.ok) {
                        throw new Error(pendingData.error || "Failed to start payment");
                    }

                    setPendingOrder({
                        reference: pendingData.reference,
                        instructions: pendingData.instructions,
                        provider: selectedPaymentMethod,
                    });
                    setSubmitting(false);
                    return;
                }
            }

            // Free tier — create the ticket immediately, no payment needed
            const { error } = await supabase.from("tickets").insert({
                event_id: id,
                user_id: session.user.id,
                status: "confirmed",
                ticket_type: selectedTicket.name,
                payment_amount: selectedTicket.price,
                payment_method: "free",
                qr_code_id: crypto.randomUUID(),
            });
            if (error) throw error;

            fetch("/api/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: session.user.email,
                    templateId: "registration-confirmation",
                    templateData: {
                        recipientName: fullName,
                        eventTitle: event?.title ?? '',
                        eventDate: new Date().toLocaleDateString(),
                        ticketType: selectedTicket.name,
                    },
                }),
            }).catch((err) => console.error("Email send failed:", err));

            setSuccess(true);
        } catch (err: any) {
            setSubmitError(err.message || "Failed to complete registration");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAzamPaySubmit = async () => {
        if (!session?.user || !azamPhone) return;
        setSubmitting(true);
        setAzamStatus(null);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_HOST_APP_URL}/api/payments/create-azampay-checkout`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        eventId: id,
                        amount: selectedTicket.price,
                        phoneNumber: azamPhone,
                        provider: azamProvider,
                        email: session.user.email,
                        name: fullName,
                        userId: session.user.id,
                        ticketTypeName: selectedTicket.name,
                    }),
                }
            );

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to start mobile money payment");
            }

            setAzamStatus(data.message || "Check your phone to approve the payment.");
        } catch (err: any) {
            setAzamStatus(err.message || "Failed to start payment");
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingEvent) {
        return (
            <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-32 text-center">
                <p className="text-gray-500">Loading event...</p>
            </main>
        );
    }

    if (!event) {
        return (
            <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-32 text-center">
                <p className="text-gray-900 font-semibold">Event not found</p>
            </main>
        );
    }

  if (success) {
        return (
            <main className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-32 text-center">
                <div className="text-5xl">✅</div>
                <h1 className="text-3xl font-bold text-gray-900">You're Registered!</h1>
                <div className="w-full rounded-3xl border border-gray-100 bg-white p-6 shadow-lg text-left">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
                        {selectedTicket.name}
                    </p>
                    <p className="mt-1 text-xl font-bold text-gray-900">{event.title}</p>
                    <p className="mt-4 text-sm text-gray-600">
                        Your ticket is saved to your account ({session?.user?.email}). To see your
                        QR ticket and event details, open the FemVents app and log in with this
                        same email and password — no need to create a new account there. We've
                        also sent a confirmation to your email.
                    </p>
                </div>
            </main>
        );
    }

    if (pendingOrder) {
        return (
            <main className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-32 text-center">
                <div className="text-5xl">💰</div>
                <h1 className="text-3xl font-bold text-gray-900">Complete Your Payment</h1>
                <div className="w-full rounded-3xl border border-gray-100 bg-white p-6 shadow-lg text-left">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
                        {pendingOrder.provider === "crypto" ? "Crypto Payment" : pendingOrder.provider}
                    </p>
                    <p className="mt-1 text-xl font-bold text-gray-900">{event.title}</p>
                    <p className="mt-4 text-sm text-gray-600">
                        Send <strong>${selectedTicket.price}</strong> using the details below. Your
                        ticket will be confirmed once the organizer verifies your payment — keep
                        your reference number handy.
                    </p>
                    {pendingOrder.provider === "crypto" && (
                        <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm space-y-1">
                            <p><strong>Wallet Address:</strong> {pendingOrder.instructions?.cryptoAddress}</p>
                            <p><strong>Network:</strong> {pendingOrder.instructions?.cryptoNetwork}</p>
                        </div>
                    )}
                    {pendingOrder.provider === "manual" && (
                        <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm space-y-1">
                            <p><strong>Bank Name:</strong> {pendingOrder.instructions?.bankName}</p>
                            <p><strong>Account Number:</strong> {pendingOrder.instructions?.accountNumber}</p>
                            <p><strong>Account Name:</strong> {pendingOrder.instructions?.accountName}</p>
                            {pendingOrder.instructions?.instructions && (
                                <p><strong>Notes:</strong> {pendingOrder.instructions.instructions}</p>
                            )}
                        </div>
                    )}
                    {pendingOrder.provider === "wise" && (
                        <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm space-y-1">
                            <p><strong>Wise Account Email:</strong> {pendingOrder.instructions?.wiseEmail}</p>
                        </div>
                    )}
                    <p className="mt-4 text-sm font-semibold text-gray-900">
                        Reference: {pendingOrder.reference}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 pb-20">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">
                    Registering for
                </p>
                <h1 className="mt-2 text-3xl font-bold text-gray-900">{event.title}</h1>
            </div>

            {!session ? (
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
                    <div className="mb-6 flex gap-2">
                        <button
                            onClick={() => setAuthMode("login")}
                            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                                authMode === "login"
                                    ? "bg-gray-900 text-white"
                                    : "bg-gray-100 text-gray-600"
                            }`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => setAuthMode("signup")}
                            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                                authMode === "signup"
                                    ? "bg-gray-900 text-white"
                                    : "bg-gray-100 text-gray-600"
                            }`}
                        >
                            Create Account
                        </button>
                    </div>

                    <form onSubmit={handleAuth} className="flex flex-col gap-4">
                        {authMode === "signup" && (
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={authName}
                                onChange={(e) => setAuthName(e.target.value)}
                                required
                                className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
                            />
                        )}
                        <input
                            type="email"
                            placeholder="Email"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            required
                            className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            required
                            minLength={6}
                            className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
                        />
                        {authError && <p className="text-sm text-red-500">{authError}</p>}
                        <button
                            type="submit"
                            disabled={authLoading}
                            className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
                        >
                            {authLoading
                                ? "Please wait..."
                                : authMode === "signup"
                                ? "Create Account & Continue"
                                : "Log In & Continue"}
                        </button>
                    </form>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">Your Details</h2>
                        <div className="flex flex-col gap-4">
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
                            />
                            <input
                                type="text"
                                placeholder="Organization"
                                value={organization}
                                onChange={(e) => setOrganization(e.target.value)}
                                className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
                            />
                            <input
                                type="text"
                                placeholder="Job Title"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
                            />
                            <input
                                type="text"
                                placeholder="Country"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
                            />
                            <textarea
                                placeholder="Dietary requirements (optional)"
                                value={dietary}
                                onChange={(e) => setDietary(e.target.value)}
                                rows={3}
                                className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
                            />
                        </div>
                    </div>

                    <div className="rounded-3xl border border-gray-100 bg-white shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-4">
                            <h2 className="text-base font-bold text-white">Choose amount</h2>
                        </div>
                        <div className="flex flex-col gap-3 p-6">
                            {ticketOptions.map((option) => (
                                <label
                                    key={option.id}
                                    className={`flex cursor-pointer items-start justify-between gap-4 rounded-xl border-2 p-4 transition-colors ${
                                        (selectedTicketId || ticketOptions[0].id) === option.id
                                            ? "border-rose-400 bg-rose-50"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="radio"
                                            name="ticket"
                                            className="mt-1"
                                            checked={(selectedTicketId || ticketOptions[0].id) === option.id}
                                            onChange={() => setSelectedTicketId(option.id)}
                                        />
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">
                                                {option.name} {option.price > 0 ? `— $${option.price}` : "— Free"}
                                            </div>
                                            {option.description && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {option.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                    {selectedTicket.price > 0 && hostMethods.length > 0 && (
                        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment Method</h2>
                            <div className="flex flex-col gap-2">
                                {hostMethods.map((m) => {
                                    const labels: Record<string, string> = {
                                        flutterwave: "Card / Flutterwave",
                                        crypto: "Crypto (USDT)",
                                        azampay: "Mobile Money (AzamPay)",
                                        wise: "Wise Transfer",
                                        manual: "Bank Transfer",
                                    };
                                    return (
                                        <label
                                            key={m.provider}
                                            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-colors ${
                                                selectedPaymentMethod === m.provider
                                                    ? "border-rose-400 bg-rose-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                checked={selectedPaymentMethod === m.provider}
                                                onChange={() => setSelectedPaymentMethod(m.provider)}
                                            />
                                            <span className="text-sm font-semibold text-gray-900">
                                                {labels[m.provider] || m.provider}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            {selectedPaymentMethod === "azampay" && (
                                <div className="mt-4 flex flex-col gap-3">
                                    <select
                                        value={azamProvider}
                                        onChange={(e) => setAzamProvider(e.target.value)}
                                        className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
                                    >
                                        <option value="Mpesa">M-Pesa</option>
                                        <option value="Tigo">Tigo Pesa</option>
                                        <option value="Airtel">Airtel Money</option>
                                        <option value="Halopesa">HaloPesa</option>
                                        <option value="Azampesa">AzamPesa</option>
                                    </select>
                                    <input
                                        type="tel"
                                        placeholder="Phone number (e.g. 255712345678)"
                                        value={azamPhone}
                                        onChange={(e) => setAzamPhone(e.target.value)}
                                        className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAzamPaySubmit}
                                        disabled={submitting || !azamPhone}
                                        className="rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                                    >
                                        {submitting ? "Sending..." : "Send payment request"}
                                    </button>
                                    {azamStatus && (
                                        <p className="text-sm text-gray-600">{azamStatus}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {submitError && (
                        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                            {submitError}
                        </p>
                    )}
                    
                    {selectedPaymentMethod !== "azampay" && (
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-4 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
                        >
                            {submitting ? "Processing..." : "Complete Registration"}
                        </button>
                    )}
                </form>
            )}
        </main>
    );
}