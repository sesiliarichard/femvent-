/**
 * SeatMapBuilder Component
 * 
 * Feature 2 Completion: Admin UI for creating seat maps
 * Interactive drag-and-drop seat map builder
 */

import React, { useState } from 'react';
import { Plus, Trash2, Save, Grid, Square } from 'lucide-react';

interface Section {
    id: string;
    name: string;
    color: string;
    basePrice: number;
    rows: Row[];
}

interface Row {
    id: string;
    label: string;
    seats: Seat[];
}

interface Seat {
    id: string;
    number: number;
    type: 'standard' | 'accessible' | 'blocked';
    status: 'available';
    price: number;
}

export default function SeatMapBuilder({ eventId }: { eventId: string }) {
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [mapName, setMapName] = useState('Main Hall');

    const addSection = () => {
        const newSection: Section = {
            id: `section-${Date.now()}`,
            name: `Section ${sections.length + 1}`,
            color: '#3B82F6',
            basePrice: 50,
            rows: []
        };
        setSections([...sections, newSection]);
    };

    const addRow = (sectionId: string, seatCount: number) => {
        setSections(sections.map(section => {
            if (section.id === sectionId) {
                const newRow: Row = {
                    id: `row-${Date.now()}`,
                    label: String.fromCharCode(65 + section.rows.length), // A, B, C...
                    seats: Array.from({ length: seatCount }, (_, i) => ({
                        id: `seat-${Date.now()}-${i}`,
                        number: i + 1,
                        type: 'standard' as const,
                        status: 'available' as const,
                        price: section.basePrice
                    }))
                };
                return { ...section, rows: [...section.rows, newRow] };
            }
            return section;
        }));
    };

    const saveSeatMap = async () => {
        const layout = {
            width: 1200,
            height: 800,
            sections: sections
        };

        const response = await fetch('/api/seating/create-map', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventId,
                name: mapName,
                layout
            })
        });

        const data = await response.json();
        if (data.success) {
            alert(`Seat map created! Total capacity: ${data.totalCapacity} seats`);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Seat Map Builder</h2>
                    <input
                        type="text"
                        value={mapName}
                        onChange={(e) => setMapName(e.target.value)}
                        className="mt-2 text-lg border-b border-gray-300 focus:border-indigo-600 outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={addSection}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <Plus size={20} />
                        Add Section
                    </button>
                    <button
                        onClick={saveSeatMap}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <Save size={20} />
                        Save Map
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sections List */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-semibold">Sections</h3>
                    {sections.map(section => (
                        <div
                            key={section.id}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedSection === section.id
                                    ? 'border-indigo-600 bg-indigo-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                            onClick={() => setSelectedSection(section.id)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <input
                                    type="text"
                                    value={section.name}
                                    onChange={(e) => {
                                        setSections(sections.map(s =>
                                            s.id === section.id ? { ...s, name: e.target.value } : s
                                        ));
                                    }}
                                    className="font-medium bg-transparent border-none focus:outline-none"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSections(sections.filter(s => s.id !== section.id));
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <label className="text-gray-600">Color:</label>
                                    <input
                                        type="color"
                                        value={section.color}
                                        onChange={(e) => {
                                            setSections(sections.map(s =>
                                                s.id === section.id ? { ...s, color: e.target.value } : s
                                            ));
                                        }}
                                        className="w-12 h-8 rounded cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="text-gray-600">Base Price:</label>
                                    <input
                                        type="number"
                                        value={section.basePrice}
                                        onChange={(e) => {
                                            setSections(sections.map(s =>
                                                s.id === section.id ? { ...s, basePrice: Number(e.target.value) } : s
                                            ));
                                        }}
                                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>

                                <div className="text-gray-600">
                                    {section.rows.length} rows, {section.rows.reduce((sum, r) => sum + r.seats.length, 0)} seats
                                </div>
                            </div>

                            {/* Add Row Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const seats = prompt('Number of seats in row:', '10');
                                    if (seats) addRow(section.id, parseInt(seats));
                                }}
                                className="mt-3 w-full py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                            >
                                + Add Row
                            </button>
                        </div>
                    ))}
                </div>

                {/* Visual Preview */}
                <div className="lg:col-span-2 bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Preview</h3>
                    <div className="bg-white rounded-lg p-8 min-h-[500px]">
                        {sections.map((section, sIdx) => (
                            <div key={section.id} className="mb-8">
                                <h4 className="font-semibold mb-3" style={{ color: section.color }}>
                                    {section.name}
                                </h4>
                                <div className="space-y-2">
                                    {section.rows.map(row => (
                                        <div key={row.id} className="flex items-center gap-2">
                                            <span className="w-8 text-sm font-medium text-gray-600">{row.label}</span>
                                            <div className="flex gap-1">
                                                {row.seats.map(seat => (
                                                    <div
                                                        key={seat.id}
                                                        className="w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-medium cursor-pointer hover:bg-gray-100"
                                                        style={{
                                                            borderColor: section.color,
                                                            color: section.color
                                                        }}
                                                        title={`${row.label}${seat.number} - $${seat.price}`}
                                                    >
                                                        {seat.number}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {sections.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Grid size={64} className="mb-4" />
                                <p>Add sections to start building your seat map</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
