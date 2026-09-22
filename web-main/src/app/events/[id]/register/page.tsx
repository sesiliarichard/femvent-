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

type Step = "ticket" | "email" | "password-new" | "password-return" | "details";

const STEP_ORDER: Step[] = ["ticket", "email", "password-new", "details"];
const bandColors = ["#2E1F45", "#9B1F5C", "#E36C54"];
const barcodeHeights = [60, 100, 40, 80, 55, 100, 30, 70, 90, 45, 100, 60];

export default function RegisterPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [event, setEvent] = useState<EventSummary | null>(null);
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [ticketTypes, setTicketTypes] = useState<PriceOption[]>([]);
    const [hostHasPayout, setHostHasPayout] = useState<boolean | null>(null);
    const [hostMethods, setHostMethods] = useState<Array<{ provider: string; instructions?: any }>>([]);

    const [session, setSession] = useState<any>(null);
    const [step, setStep] = useState<Step>("ticket");

    const [authEmail, setAuthEmail] = useState("");
    const [authPassword, setAuthPassword] = useState("");
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

    const currentStepIndex = () => {
        if (step === "password-return") return STEP_ORDER.indexOf("password-new");
        return STEP_ORDER.indexOf(step === "details" ? "details" : step);
    };

    // --- Step 1: Ticket -> Step 2 (or straight to Details if already logged in) ---
    const handleContinueFromTicket = () => {
        setStep(session?.user ? "details" : "email");
    };

    // --- Step 2: Email -> checks the users table, branches new vs returning ---
    const handleContinueFromEmail = async () => {
        setAuthError("");
        if (!authEmail) {
            setAuthError("Please enter your email.");
            return;
        }
        setAuthLoading(true);
        try {
            const { data } = await supabase
                .from("users")
                .select("id")
                .eq("email", authEmail)
                .maybeSingle();
            setStep(data ? "password-return" : "password-new");
        } catch (err: any) {
            setAuthError(err.message || "Something went wrong, please try again.");
        } finally {
            setAuthLoading(false);
        }
    };

    // --- Step 3b: Returning user logs in directly ---
    const handleLoginContinue = async () => {
        setAuthError("");
        setAuthLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: authEmail,
                password: authPassword,
            });
            if (error) throw error;
            setStep("details");
        } catch (err: any) {
            setAuthError(err.message || "Login failed. Check your password and try again.");
        } finally {
            setAuthLoading(false);
        }
    };

    // --- Step 3a: New user sets name + password, account is created at final submit ---
    const handleContinueFromNewAccount = () => {
        setAuthError("");
        if (!fullName || !authPassword) {
            setAuthError("Please fill in your name and a password.");
            return;
        }
        if (authPassword.length < 6) {
            setAuthError("Password must be at least 6 characters.");
            return;
        }
        setStep("details");
    };

    // Creates the account at final submission time, if the person isn't already logged in.
    const ensureAccount = async () => {
        if (session?.user) return session.user;

        const { data, error } = await supabase.auth.signUp({
            email: authEmail,
            password: authPassword,
        });
        if (error) throw error;
        if (!data.user) throw new Error("Could not create your account. Please try again.");

        const { error: insertError } = await supabase.from("users").insert({
            id: data.user.id,
            name: fullName,
            email: authEmail,
            phone,
            company: organization,
            job_title: jobTitle,
            role: "attendee",
            status: "active",
        });
        if (insertError) throw insertError;

        return data.user;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");
        setSubmitting(true);

        try {
            const activeUser = await ensureAccount();

            if (session?.user) {
                const { error: profileError } = await supabase
                    .from("users")
                    .update({
                        name: fullName,
                        phone,
                        company: organization,
                        job_title: jobTitle,
                    })
                    .eq("id", activeUser.id);
                if (profileError) throw profileError;
            }

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
                    setSubmitting(false);
                    return;
                }

                if (selectedPaymentMethod === "flutterwave") {
                    const res = await fetch("/api/payments/create-checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            eventId: id,
                            amount: selectedTicket.price,
                            email: activeUser.email,
                            name: fullName,
                            userId: activeUser.id,
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
                    const cryptoRes = await fetch(
                        `${process.env.NEXT_PUBLIC_HOST_APP_URL}/api/payments/create-crypto-checkout`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                eventId: id,
                                amount: selectedTicket.price,
                                email: activeUser.email,
                                name: fullName,
                                userId: activeUser.id,
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

                if (selectedPaymentMethod === "pesapal") {
                    const pesapalRes = await fetch(
                        `${process.env.NEXT_PUBLIC_HOST_APP_URL}/api/payments/create-pesapal-checkout`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                eventId: id,
                                amount: selectedTicket.price,
                                email: activeUser.email,
                                name: fullName,
                                userId: activeUser.id,
                                ticketTypeName: selectedTicket.name,
                            }),
                        }
                    );

                    const pesapalData = await pesapalRes.json();
                    if (!pesapalRes.ok || !pesapalData.sessionUrl) {
                        throw new Error(pesapalData.error || "Failed to start payment");
                    }

                    window.location.href = pesapalData.sessionUrl;
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
                                userId: activeUser.id,
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

            const { data: newTicket, error } = await supabase
                .from("tickets")
                .insert({
                    event_id: id,
                    user_id: activeUser.id,
                    status: "confirmed",
                    ticket_type: selectedTicket.name,
                    payment_amount: selectedTicket.price,
                    payment_method: "free",
                    qr_code_id: crypto.randomUUID(),
                })
                .select()
                .single();
            if (error) throw error;

            fetch("/api/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: activeUser.email,
                    templateId: "registration-confirmation",
                    templateData: {
                        recipientName: fullName,
                        eventTitle: event?.title ?? '',
                        eventDate: new Date().toLocaleDateString(),
                        ticketType: selectedTicket.name,
                        ticketId: newTicket?.id,
                        eventId: id,
                        userId: activeUser.id,
                        qrCodeId: newTicket?.qr_code_id,
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
        if (!azamPhone) return;
        setSubmitting(true);
        setAzamStatus(null);
        try {
            const activeUser = await ensureAccount();
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
                        email: activeUser.email,
                        name: fullName,
                        userId: activeUser.id,
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
                <p className="text-[#8A7A97]">Loading event...</p>
            </main>
        );
    }

    if (!event) {
        return (
            <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-32 text-center">
                <p className="text-[#2E1F45] font-semibold">Event not found</p>
            </main>
        );
    }

    if (success) {
        return (
            <main className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-32 text-center">
                <div className="text-5xl">✅</div>
                <h1 className="text-3xl font-bold text-[#2E1F45]">You're Registered!</h1>
                <div className="w-full rounded-3xl border border-[#D9C9E0] bg-white p-6 shadow-lg text-left">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9B1F5C]">
                        {selectedTicket.name}
                    </p>
                    <p className="mt-1 text-xl font-bold text-[#2E1F45]">{event.title}</p>
                    <p className="mt-4 text-sm text-[#5C4A6B]">
                        Your ticket is saved to your account ({authEmail || "your email"}). To see your
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
                <h1 className="text-3xl font-bold text-[#2E1F45]">Complete Your Payment</h1>
                <div className="w-full rounded-3xl border border-[#D9C9E0] bg-white p-6 shadow-lg text-left">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9B1F5C]">
                        {pendingOrder.provider === "crypto" ? "Crypto Payment" : pendingOrder.provider}
                    </p>
                    <p className="mt-1 text-xl font-bold text-[#2E1F45]">{event.title}</p>
                    <p className="mt-4 text-sm text-[#5C4A6B]">
                        Send <strong>${selectedTicket.price}</strong> using the details below. Your
                        ticket will be confirmed once the organizer verifies your payment — keep
                        your reference number handy.
                    </p>
                    {pendingOrder.provider === "crypto" && (
                        <div className="mt-4 rounded-xl bg-[#F6EEF7] p-4 text-sm space-y-1">
                            <p><strong>Wallet Address:</strong> {pendingOrder.instructions?.cryptoAddress}</p>
                            <p><strong>Network:</strong> {pendingOrder.instructions?.cryptoNetwork}</p>
                        </div>
                    )}
                    {pendingOrder.provider === "manual" && (
                        <div className="mt-4 rounded-xl bg-[#F6EEF7] p-4 text-sm space-y-1">
                            <p><strong>Bank Name:</strong> {pendingOrder.instructions?.bankName}</p>
                            <p><strong>Account Number:</strong> {pendingOrder.instructions?.accountNumber}</p>
                            <p><strong>Account Name:</strong> {pendingOrder.instructions?.accountName}</p>
                            {pendingOrder.instructions?.instructions && (
                                <p><strong>Notes:</strong> {pendingOrder.instructions.instructions}</p>
                            )}
                        </div>
                    )}
                    {pendingOrder.provider === "wise" && (
                        <div className="mt-4 rounded-xl bg-[#F6EEF7] p-4 text-sm space-y-1">
                            <p><strong>Wise Account Email:</strong> {pendingOrder.instructions?.wiseEmail}</p>
                        </div>
                    )}
                    <p className="mt-4 text-sm font-semibold text-[#2E1F45]">
                        Reference: {pendingOrder.reference}
                    </p>
                </div>
            </main>
        );
    }

    const stepIdx = currentStepIndex();

    return (
        <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 pb-20 pt-10">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9B1F5C]">
                    Registering for
                </p>
                <h1 className="mt-2 text-3xl font-bold text-[#2E1F45]">{event.title}</h1>
            </div>

            <div className="flex gap-1.5">
                {STEP_ORDER.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${i <= stepIdx ? "bg-[#9B1F5C]" : "bg-[#D9C9E0]"}`}
                    />
                ))}
            </div>

            {/* Step 1: Ticket */}
            {step === "ticket" && (
                <div className="flex flex-col gap-4">
                    <div>
                        <h2 className="px-1 text-lg font-semibold text-[#2E1F45]">Choose your ticket</h2>
                        <p className="px-1 text-xs text-[#8A7A97]">Step 1 of 4 — no account needed yet.</p>
                    </div>
                    {ticketOptions.map((option, index) => {
                        const isSelected = (selectedTicketId || ticketOptions[0].id) === option.id;
                        const bandColor = bandColors[index % bandColors.length];
                        return (
                            <label
                                key={option.id}
                                className={`block cursor-pointer overflow-hidden rounded-2xl border-2 bg-white shadow-md transition-colors ${
                                    isSelected ? "border-[#9B1F5C]" : "border-transparent"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="ticket"
                                    className="sr-only"
                                    checked={isSelected}
                                    onChange={() => setSelectedTicketId(option.id)}
                                />
                                <div
                                    className="flex items-center justify-between px-5 py-3 text-xs font-bold uppercase tracking-wide text-white"
                                    style={{ backgroundColor: bandColor }}
                                >
                                    <span>Ticket type</span>
                                    <span>{option.name}</span>
                                </div>
                                <div className="px-5 pb-2 pt-4">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-lg font-extrabold capitalize text-[#2E1F45]">
                                            {option.name}
                                        </span>
                                        <span className="text-xl font-extrabold text-[#2E1F45]">
                                            {option.price > 0 ? `$${option.price}` : "$0"}
                                        </span>
                                    </div>
                                    {option.description ? (
                                        <p className="mt-2 text-xs leading-relaxed text-[#8A7A97]">
                                            {option.description}
                                        </p>
                                    ) : (
                                        <p className="mt-2 text-xs italic leading-relaxed text-[#c4b8cf]">
                                            No description added yet
                                        </p>
                                    )}
                                </div>
                                <div className="mt-4 flex items-center px-1">
                                    <div className="-ml-2 h-4 w-4 rounded-full bg-[#FBF3FA]" />
                                    <div className="flex-1 border-t-2 border-dashed border-[#D9C9E0]" />
                                    <div className="-mr-2 h-4 w-4 rounded-full bg-[#FBF3FA]" />
                                </div>
                                <div className="flex items-center justify-between px-5 pb-4 pt-3">
                                    <div className="flex h-6 items-end gap-[2px] opacity-30">
                                        {barcodeHeights.map((h, i) => (
                                            <div key={i} className="w-[2px] bg-[#2E1F45]" style={{ height: `${h}%` }} />
                                        ))}
                                    </div>
                                    <span
                                        className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${
                                            isSelected ? "bg-[#9B1F5C] text-white" : "bg-[#D9C9E0] text-[#5C4A6B]"
                                        }`}
                                    >
                                        {isSelected ? "Selected" : "Select"}
                                    </span>
                                </div>
                            </label>
                        );
                    })}
                    <button
                        type="button"
                        onClick={handleContinueFromTicket}
                        className="rounded-full bg-[#9B1F5C] px-6 py-4 text-sm font-semibold text-[#FBF3FA] shadow-lg hover:bg-[#7A1745] transition-colors"
                    >
                        Continue
                    </button>
                </div>
            )}

            {/* Step 2: Email */}
            {step === "email" && (
                <div className="flex flex-col gap-4">
                    <div className="rounded-3xl border border-[#D9C9E0] bg-white p-6 shadow-lg">
                        <h2 className="text-lg font-semibold text-[#2E1F45]">What's your email?</h2>
                        <p className="mt-1 mb-4 text-xs text-[#8A7A97]">
                            Step 2 of 4 — we'll check if you've registered with us before.
                        </p>
                        <input
                            type="email"
                            placeholder="you@email.com"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            className="w-full rounded-xl border border-[#D9C9E0] px-4 py-3 text-sm"
                        />
                        {authError && <p className="mt-3 text-sm text-red-500">{authError}</p>}
                        <button
                            type="button"
                            onClick={handleContinueFromEmail}
                            disabled={authLoading}
                            className="mt-4 w-full rounded-full bg-[#9B1F5C] px-6 py-3 text-sm font-semibold text-[#FBF3FA] shadow-lg disabled:opacity-60 hover:bg-[#7A1745] transition-colors"
                        >
                            {authLoading ? "Checking..." : "Continue"}
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setStep("ticket")}
                        className="self-start text-sm font-semibold text-[#9B1F5C] underline"
                    >
                        ← Back
                    </button>
                </div>
            )}

            {/* Step 3a: New account */}
            {step === "password-new" && (
                <div className="flex flex-col gap-4">
                    <div className="rounded-3xl border border-[#D9C9E0] bg-white p-6 shadow-lg">
                        <span className="mb-3 inline-block rounded-full bg-[#F9E5F0] px-3 py-1 text-xs font-bold text-[#7A1745]">
                            New here
                        </span>
                        <h2 className="text-lg font-semibold text-[#2E1F45]">Set a password</h2>
                        <p className="mt-1 mb-4 text-xs text-[#8A7A97]">
                            This is the only account step — use it to view your ticket and log into the FemVents app later.
                        </p>
                        <input
                            type="text"
                            placeholder="Full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="mb-3 w-full rounded-xl border border-[#D9C9E0] px-4 py-3 text-sm"
                        />
                        <input
                            type="password"
                            placeholder="Password (min 6 characters)"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full rounded-xl border border-[#D9C9E0] px-4 py-3 text-sm"
                        />
                        {authError && <p className="mt-3 text-sm text-red-500">{authError}</p>}
                        <button
                            type="button"
                            onClick={handleContinueFromNewAccount}
                            className="mt-4 w-full rounded-full bg-[#9B1F5C] px-6 py-3 text-sm font-semibold text-[#FBF3FA] shadow-lg hover:bg-[#7A1745] transition-colors"
                        >
                            Continue
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setStep("email")}
                        className="self-start text-sm font-semibold text-[#9B1F5C] underline"
                    >
                        ← Back
                    </button>
                </div>
            )}

            {/* Step 3b: Returning user */}
            {step === "password-return" && (
                <div className="flex flex-col gap-4">
                    <div className="rounded-3xl border border-[#D9C9E0] bg-white p-6 shadow-lg">
                        <span className="mb-3 inline-block rounded-full bg-[#F9E5F0] px-3 py-1 text-xs font-bold text-[#7A1745]">
                            Welcome back
                        </span>
                        <h2 className="text-lg font-semibold text-[#2E1F45]">Enter your password</h2>
                        <p className="mt-1 mb-4 text-xs text-[#8A7A97]">
                            {authEmail} already has a FemVents account.
                        </p>
                        <input
                            type="password"
                            placeholder="Password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full rounded-xl border border-[#D9C9E0] px-4 py-3 text-sm"
                        />
                        {authError && <p className="mt-3 text-sm text-red-500">{authError}</p>}
                        <button
                            type="button"
                            onClick={handleLoginContinue}
                            disabled={authLoading}
                            className="mt-4 w-full rounded-full bg-[#9B1F5C] px-6 py-3 text-sm font-semibold text-[#FBF3FA] shadow-lg disabled:opacity-60 hover:bg-[#7A1745] transition-colors"
                        >
                            {authLoading ? "Logging in..." : "Log in and continue"}
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setStep("email")}
                        className="self-start text-sm font-semibold text-[#9B1F5C] underline"
                    >
                        ← Not you? Use a different email
                    </button>
                </div>
            )}

            {/* Step 4: Details + payment */}
            {step === "details" && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="rounded-3xl border border-[#D9C9E0] bg-white p-6 shadow-lg">
                        <h2 className="mb-1 text-lg font-semibold text-[#2E1F45]">A few more details</h2>
                        <p className="mb-4 text-xs text-[#8A7A97]">Step 4 of 4 — just for the event, nothing to do with your login.</p>
                        <div className="flex flex-col gap-4">
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="rounded-xl border border-[#D9C9E0] px-4 py-3 text-sm"
                            />
                            <input
                                type="text"
                                placeholder="Organization"
                                value={organization}
                                onChange={(e) => setOrganization(e.target.value)}
                                className="rounded-xl border border-[#D9C9E0] px-4 py-3 text-sm"
                            />
                            <input
                                type="text"
                                placeholder="Job Title"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                className="rounded-xl border border-[#D9C9E0] px-4 py-3 text-sm"
                            />
                            <input
                                type="text"
                                placeholder="Country"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="rounded-xl border border-[#D9C9E0] px-4 py-3 text-sm"
                            />
                            <textarea
                                placeholder="Dietary requirements (optional)"
                                value={dietary}
                                onChange={(e) => setDietary(e.target.value)}
                                rows={3}
                                className="rounded-xl border border-[#D9C9E0] px-4 py-3 text-sm"
                            />
                        </div>
                    </div>

                    {selectedTicket.price > 0 && hostMethods.length > 0 && (
                        <div className="rounded-3xl border border-[#D9C9E0] bg-white p-6 shadow-lg">
                            <h2 className="mb-4 text-lg font-semibold text-[#2E1F45]">Payment Method</h2>
                            <div className="flex flex-col gap-2">
                                {hostMethods.map((m) => {
                                  const labels: Record<string, string> = {
                                    flutterwave: "Card / Flutterwave",
                                    crypto: "Crypto (USDT)",
                                    azampay: "Mobile Money (AzamPay)",
                                    pesapal: "Card / Mobile Money (Pesapal)",
                                    wise: "Wise Transfer",
                                    manual: "Bank Transfer",
                                };
                                    return (
                                        <label
                                            key={m.provider}
                                            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-colors ${
                                                selectedPaymentMethod === m.provider
                                                    ? "border-[#9B1F5C] bg-[#F9E5F0]"
                                                    : "border-[#D9C9E0] hover:border-[#B9A9C4]"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                checked={selectedPaymentMethod === m.provider}
                                                onChange={() => setSelectedPaymentMethod(m.provider)}
                                            />
                                            <span className="text-sm font-semibold text-[#2E1F45]">
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
                                        className="rounded-xl border border-[#D9C9E0] px-4 py-3 text-sm"
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
                                        className="rounded-xl border border-[#D9C9E0] px-4 py-3 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAzamPaySubmit}
                                        disabled={submitting || !azamPhone}
                                        className="rounded-full bg-[#2E1F45] px-6 py-3 text-sm font-semibold text-[#FBF3FA] disabled:opacity-60"
                                    >
                                        {submitting ? "Sending..." : "Send payment request"}
                                    </button>
                                    {azamStatus && (
                                        <p className="text-sm text-[#5C4A6B]">{azamStatus}</p>
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
                            className="rounded-full bg-[#9B1F5C] px-6 py-4 text-sm font-semibold text-[#FBF3FA] shadow-lg disabled:opacity-60 hover:bg-[#7A1745] transition-colors"
                        >
                            {submitting ? "Processing..." : "Complete Registration"}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setStep(session?.user ? "ticket" : "password-new")}
                        className="self-start text-sm font-semibold text-[#9B1F5C] underline"
                    >
                        ← Back
                    </button>
                </form>
            )}
        </main>
    );
}