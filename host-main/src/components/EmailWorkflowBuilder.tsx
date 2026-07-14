/**
 * EmailWorkflowBuilder Component
 * 
 * Feature 4 Completion: Visual workflow builder for automated emails
 * Drag-and-drop email sequence creator
 */

import React, { useState } from 'react';
import { Plus, Mail, Clock, Send, Save, Trash2 } from 'lucide-react';

interface WorkflowStep {
    id: string;
    order: number;
    delay: number;
    subject: string;
    content: string;
    emailTemplateId?: string;
}

export default function EmailWorkflowBuilder({ eventId }: { eventId: string }) {
    const [workflowName, setWorkflowName] = useState('Welcome Series');
    const [trigger, setTrigger] = useState<'registration' | 'date_based'>('registration');
    const [steps, setSteps] = useState<WorkflowStep[]>([]);
    const [selectedStep, setSelectedStep] = useState<string | null>(null);

    const addStep = () => {
        const newStep: WorkflowStep = {
            id: `step-${Date.now()}`,
            order: steps.length,
            delay: steps.length === 0 ? 0 : 60, // First step immediate, others 1 hour
            subject: '',
            content: '',
        };
        setSteps([...steps, newStep]);
        setSelectedStep(newStep.id);
    };

    const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
        setSteps(steps.map(step =>
            step.id === stepId ? { ...step, ...updates } : step
        ));
    };

    const deleteStep = (stepId: string) => {
        setSteps(steps.filter(step => step.id !== stepId));
        if (selectedStep === stepId) setSelectedStep(null);
    };

    const saveWorkflow = async () => {
        const workflowData = {
            eventId,
            name: workflowName,
            trigger: {
                type: trigger,
                config: {}
            },
            steps: steps.map(step => ({
                ...step,
                emailTemplateId: step.emailTemplateId || null
            })),
            status: 'draft' as const,
            stats: {
                sent: 0,
                delivered: 0,
                opened: 0,
                clicked: 0,
                bounced: 0,
                unsubscribed: 0
            },
            settings: {
                timezone: 'UTC',
                skipWeekends: false
            }
        };

        const response = await fetch('/api/email-workflows/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workflowData)
        });

        const data = await response.json();
        if (data.success) {
            alert('Workflow saved successfully!');
        }
    };

    const selectedStepData = steps.find(s => s.id === selectedStep);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Email Workflow Builder</h2>
                    <input
                        type="text"
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                        className="mt-2 text-lg border-b border-gray-300 focus:border-indigo-600 outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={saveWorkflow}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <Save size={20} />
                        Save Workflow
                    </button>
                </div>
            </div>

            {/* Trigger Selection */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Workflow Trigger</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setTrigger('registration')}
                        className={`p-4 border-2 rounded-lg text-left transition-colors ${trigger === 'registration'
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="font-semibold">When someone registers</div>
                        <div className="text-sm text-gray-600 mt-1">
                            Triggered immediately after ticket purchase
                        </div>
                    </button>

                    <button
                        onClick={() => setTrigger('date_based')}
                        className={`p-4 border-2 rounded-lg text-left transition-colors ${trigger === 'date_based'
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="font-semibold">Days before event</div>
                        <div className="text-sm text-gray-600 mt-1">
                            Send reminders before the event starts
                        </div>
                    </button>

                    <button
                        className="p-4 border-2 border-gray-200 rounded-lg text-left opacity-50 cursor-not-allowed"
                    >
                        <div className="font-semibold">After event ends</div>
                        <div className="text-sm text-gray-600 mt-1">
                            Follow-up surveys and thank you emails
                        </div>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Steps Timeline */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Email Steps</h3>
                        <button
                            onClick={addStep}
                            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                        >
                            <Plus size={16} />
                            Add Step
                        </button>
                    </div>

                    <div className="space-y-3">
                        {steps.map((step, index) => (
                            <div
                                key={step.id}
                                onClick={() => setSelectedStep(step.id)}
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedStep === step.id
                                        ? 'border-indigo-600 bg-indigo-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Mail size={18} className="text-indigo-600" />
                                        <span className="font-semibold">Step {index + 1}</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteStep(step.id);
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="text-sm text-gray-600">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Clock size={14} />
                                        {step.delay === 0
                                            ? 'Send immediately'
                                            : `Wait ${step.delay} minutes`}
                                    </div>
                                    <div className="font-medium text-gray-900">
                                        {step.subject || 'No subject'}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {steps.length === 0 && (
                            <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                <Mail size={40} className="mx-auto mb-2 opacity-50" />
                                <p>No steps yet</p>
                                <p className="text-sm">Add a step to get started</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Step Editor */}
                <div className="lg:col-span-2">
                    {selectedStepData ? (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">
                                Edit Step {steps.findIndex(s => s.id === selectedStep) + 1}
                            </h3>

                            <div className="space-y-4">
                                {/* Delay */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Delay (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={selectedStepData.delay}
                                        onChange={(e) =>
                                            updateStep(selectedStep!, { delay: Number(e.target.value) })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        {selectedStepData.delay === 0
                                            ? 'Email will be sent immediately'
                                            : `Email will be sent ${selectedStepData.delay} minutes after trigger`}
                                    </p>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Subject
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedStepData.subject}
                                        onChange={(e) =>
                                            updateStep(selectedStep!, { subject: e.target.value })
                                        }
                                        placeholder="Welcome to {{eventTitle}}!"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Use {"{{eventTitle}}"}, {"{{userName}}"} for personalization
                                    </p>
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Content
                                    </label>
                                    <textarea
                                        value={selectedStepData.content}
                                        onChange={(e) =>
                                            updateStep(selectedStep!, { content: e.target.value })
                                        }
                                        rows={12}
                                        placeholder="Hi {{userName}},&#10;&#10;Thank you for registering for {{eventTitle}}!&#10;&#10;We're excited to see you there."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                    />
                                </div>

                                {/* Preview */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Preview
                                    </label>
                                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                                        <div className="bg-white rounded p-4 shadow-sm">
                                            <div className="font-semibold text-lg mb-3">
                                                {selectedStepData.subject || 'No subject'}
                                            </div>
                                            <div className="whitespace-pre-wrap text-gray-700">
                                                {selectedStepData.content || 'No content'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
                            <Send size={64} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg">Select a step to edit</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
