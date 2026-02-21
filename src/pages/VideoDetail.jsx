import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import StatusBadge from '../components/ui/StatusBadge';
import { Play, Database, Cpu, Layers, FileText, AlertCircle, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DEFAULT_REAL_ESTATE_COLS = [
    "Property Type",
    "Location",
    "Price/Rent",
    "Size/Area",
    "Property Status (Rent/Sale)",
    "Furnishing",
    "Amenities",
    "Property Condition"
];

const VideoDetail = () => {
    const { id } = useParams();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [suggestions, setSuggestions] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [extracting, setExtracting] = useState(false);
    const [translatedText, setTranslatedText] = useState(null);
    const [translating, setTranslating] = useState(false);
    const [suggestingMore, setSuggestingMore] = useState(false);

    const handleSuggestMore = async () => {
        setSuggestingMore(true);
        const toastId = toast.loading('Querying AI for deeper patterns...');
        try {
            const { data } = await client.post(`/extractions/suggest-more/${id}`);
            if (data.suggested_columns) {
                // Merge and filter unique columns
                setSuggestions(prev => [...new Set([...prev, ...data.suggested_columns])]);

                // Update video state with remaining count
                if (data.suggestions_remaining !== undefined) {
                    setVideo(prev => prev ? { ...prev, suggestions_remaining: data.suggestions_remaining } : prev);
                }
            }
            toast.success("New Data Points Discovered", { id: toastId });
        } catch (error) {
            console.error("Suggest more error", error);
            toast.error("Discovery Failed", { id: toastId });
        } finally {
            setSuggestingMore(false);
        }
    };

    const handleTranslate = async () => {
        setTranslating(true);
        const toastId = toast.loading('Connecting to Universal Translator...');
        try {
            const { data } = await client.post(`/videos/${id}/translate`);
            setTranslatedText(data.translated_text);
            toast.success("Translation Complete", { id: toastId });
        } catch (error) {
            console.error("Translation error", error);
            toast.error("Translation Failed", { id: toastId });
        } finally {
            setTranslating(false);
        }
    };

    // Polling logic
    useEffect(() => {
        let interval;

        const fetchVideo = async () => {
            try {
                const { data } = await client.get(`/videos/${id}`);
                setVideo(data);

                if (data.suggested_columns && data.suggested_columns.length > 0) {
                    // Update suggestions while preserving defaults and avoiding duplicates
                    setSuggestions(prev => {
                        const allCols = [...new Set([...DEFAULT_REAL_ESTATE_COLS, ...prev, ...data.suggested_columns])];
                        return allCols;
                    });
                } else if (suggestions.length === 0) {
                    setSuggestions(DEFAULT_REAL_ESTATE_COLS);
                }

                // If backend says extracting, keep frontend in extracting state
                if (data.status === 'extracting') {
                    setExtracting(true);
                } else if (data.status === 'completed' || data.status === 'failed' || data.status === 'awaiting_selection') {
                    setExtracting(false);
                }

                setLoading(false);
            } catch (error) {
                console.error("Error fetching video", error);
                toast.error("Signal Lost");
            }
        };

        fetchVideo();
        interval = setInterval(fetchVideo, 3000);

        return () => clearInterval(interval);
    }, [id, suggestions.length]);

    const handleExtract = async () => {
        if (selectedColumns.length === 0) {
            toast.error("Select data points to extract");
            return;
        }

        setExtracting(true);
        try {
            await client.post(`/videos/${id}/extract`, {
                selected_columns: selectedColumns
            });
            toast.success("Extraction Subroutine Initiated");
            setSelectedColumns([]); // Clear them so they aren't stuck for next round
        } catch (error) {
            console.error("Extraction error", error);
            toast.error("Extraction Failed");
            setExtracting(false);
        }
    };

    const toggleColumn = (col) => {
        if (selectedColumns.includes(col)) {
            setSelectedColumns(selectedColumns.filter(c => c !== col));
        } else {
            setSelectedColumns([...selectedColumns, col]);
        }
    };

    if (loading && !video) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin text-neon-cyan"><Cpu size={48} /></div>
            </div>
        );
    }

    if (!video) return <div className="text-center text-white">Signal Lost (404)</div>;

    const isProcessing = ['pending', 'transcribing', 'extracting'].includes(video.status);
    const isReadyForExtraction = ['awaiting_selection', 'completed', 'failed'].includes(video.status);
    const hasResults = video.status === 'completed' && video.extracted_data;

    const getOptimizedVideoUrl = (url) => {
        if (!url || !url.includes('cloudinary.com')) return url;
        if (url.includes('/upload/')) {
            // Apply Cloudinary automatic video optimizations
            return url.replace('/upload/', '/upload/f_auto,q_auto,vc_h264/');
        }
        return url;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[calc(100vh-10rem)]">
            {/* Left Column: Video Player */}
            <div className="lg:col-span-2 space-y-6">
                {video.status === 'failed' && (
                    <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg flex items-start gap-3 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                        <div>
                            <h3 className="text-red-500 font-bold text-sm tracking-wider uppercase">Signal Processor Offline</h3>
                            <p className="text-red-200/70 text-xs font-mono mt-1">
                                {video.error_message || "An unknown error occurred during signal processing."}
                            </p>
                        </div>
                    </div>
                )}

                <GlassCard className="p-1 aspect-video flex items-center justify-center bg-black/80 border-neon-cyan/30 shadow-[0_0_30px_rgba(5,217,232,0.1)] overflow-hidden relative group">
                    {video.video_url ? (
                        <video
                            src={getOptimizedVideoUrl(video.video_url)}
                            controls
                            preload="metadata"
                            className="w-full h-full object-contain"
                            poster={video.thumbnail_url}
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-white/30">
                            <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 animate-spin-slow flex items-center justify-center">
                                <Play size={32} />
                            </div>
                            <p className="font-mono text-xs tracking-widest uppercase">Media buffer buffering...</p>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                            <div className="text-center space-y-4">
                                <Cpu className="mx-auto text-neon-cyan animate-pulse" size={48} />
                                <h3 className="text-xl font-display text-white tracking-widest animate-pulse">
                                    {video.status === 'transcribing' ? 'DECODING AUDIO STREAM' : 'PROCESSING SUBROUTINES'}
                                </h3>
                                <p className="text-neon-cyan/70 font-mono text-xs">
                                    PLEASE WAIT...
                                </p>
                            </div>
                        </div>
                    )}
                </GlassCard>

                <div className="flex justify-between items-start">
                    <div className="space-y-2 max-w-2xl">
                        <h1 className="text-3xl font-display font-bold text-white tracking-wide">{video.title || "Unknown Stream"}</h1>
                        {video.description && (
                            <p className="text-white/70 text-sm leading-relaxed mb-2">
                                {video.description}
                            </p>
                        )}
                        <div className="flex items-center gap-4 text-sm font-mono text-white/50">
                            <span>ID: <span className="text-neon-cyan/60">{video.id}</span></span>
                            <span>|</span>
                            <span>{new Date(video.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                    <StatusBadge status={video.status} />
                </div>

                {video.transcript && (
                    <div className="mt-8 space-y-4">
                        <h3 className="text-xl font-display font-bold text-white flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <FileText className="text-neon-cyan" size={24} />
                                TRANSCRIPT
                            </span>
                            {!translatedText && (
                                <NeonButton variant="cyan" onClick={handleTranslate} disabled={translating}>
                                    {translating ? 'Connecting...' : 'Translate to English'}
                                </NeonButton>
                            )}
                        </h3>
                        <GlassCard className="p-6 relative max-h-[400px] overflow-y-auto">
                            <p className="font-mono text-sm leading-relaxed text-white/80 whitespace-pre-wrap">
                                {translatedText || video.transcript}
                            </p>
                            {translatedText && (
                                <div className="absolute top-2 right-2 px-2 py-1 bg-neon-cyan/20 border border-neon-cyan rounded text-[10px] font-bold text-neon-cyan tracking-widest uppercase shadow-[0_0_10px_rgba(5,217,232,0.5)]">
                                    EN TRANSLATION ACTIVE
                                </div>
                            )}
                        </GlassCard>
                    </div>
                )}
            </div>

            {/* Right Column: Interaction Panel */}
            <div className="space-y-6 lg:max-h-[calc(100vh-10rem)] overflow-y-auto pr-2 custom-scrollbar">
                {/* BOX 1: CORE REAL ESTATE SPECS */}
                <GlassCard className="p-5 border-neon-cyan/20 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-neon-cyan/5 rounded-full blur-[40px] pointer-events-none" />

                    <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                        <Database className="text-neon-cyan" size={18} />
                        CORE PROPERTY SPECS
                    </h2>

                    <div className="space-y-3">
                        {DEFAULT_REAL_ESTATE_COLS.map(col => {
                            const value = video.extracted_data?.[col];
                            const hasKey = video.extracted_data && col in video.extracted_data;
                            const isActualValue = hasKey && value !== "Not mentioned" && value !== "N/A" && value !== "Not found";

                            return (
                                <div key={col} className="flex justify-between items-start gap-4 p-2 rounded bg-white/5 border border-white/5 hover:border-neon-cyan/30 transition-colors">
                                    <span className="text-white/40 font-mono text-[9px] uppercase tracking-wider py-1">{col}</span>
                                    <span className={`text-xs font-medium text-right ${isActualValue ? 'text-neon-cyan' : 'text-white/20 italic'}`}>
                                        {!hasKey ? 'Scanning...' : value || 'Not mentioned'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>

                {/* BOX 2: AI PATTERN DISCOVERY */}
                <GlassCard className="p-5 border-neon-pink/20 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-neon-pink/5 rounded-full blur-[40px] pointer-events-none" />

                    <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                        <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                            <Layers className="text-neon-pink" size={18} />
                            AI DISCOVERY
                        </h2>
                        {isReadyForExtraction && (
                            <div className="flex flex-col items-end">
                                <button
                                    onClick={handleSuggestMore}
                                    disabled={suggestingMore || video.suggestions_remaining === 0 || extracting}
                                    className="text-[10px] font-mono text-neon-cyan hover:text-white transition-colors flex items-center gap-1 disabled:opacity-30"
                                >
                                    {suggestingMore ? <Cpu size={10} className="animate-spin" /> : '+ Suggest more'}
                                </button>
                                <span className="text-[8px] font-mono text-white/30 uppercase">
                                    {video.suggestions_remaining} Cycles Left
                                </span>
                            </div>
                        )}
                    </div>

                    {isReadyForExtraction ? (
                        <div className="space-y-6">
                            {/* Discovery Buttons */}
                            <div>
                                <p className="text-[9px] font-mono text-white/40 mb-3 uppercase tracking-widest flex justify-between">
                                    Select Patterns
                                    <span className="text-neon-pink">{video.extractions_remaining} / 3 Cycles Left</span>
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestions.filter(c => !DEFAULT_REAL_ESTATE_COLS.includes(c)).length > 0 ?
                                        suggestions.filter(c => !DEFAULT_REAL_ESTATE_COLS.includes(c)).map(col => {
                                            const isExtracted = video.extracted_data && col in video.extracted_data && video.extracted_data[col] !== "Not mentioned";
                                            const isSelected = selectedColumns.includes(col);
                                            return (
                                                <button
                                                    key={col}
                                                    disabled={isExtracted || extracting || (video.extractions_remaining === 0 && !isSelected)}
                                                    onClick={() => toggleColumn(col)}
                                                    className={`
                                                        px-2 py-1 rounded text-[9px] font-mono border transition-all
                                                        ${isExtracted ? 'bg-neon-cyan/5 border-neon-cyan/20 text-neon-cyan/40 cursor-not-allowed' :
                                                            isSelected ? 'bg-neon-pink/20 border-neon-pink text-white shadow-[0_0_10px_rgba(255,42,109,0.3)]' :
                                                                'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'}
                                                    `}
                                                >
                                                    {col} {isExtracted && '✓'}
                                                </button>
                                            );
                                        }) : (
                                            <div className="w-full py-4 text-center">
                                                <p className="text-[#888] italic text-[10px] font-mono">No hidden patterns found yet.</p>
                                                <p className="text-[8px] text-[#555] font-mono uppercase mt-1 tracking-tighter">Use "Suggest more" to scan deeper...</p>
                                            </div>
                                        )
                                    }
                                </div>
                            </div>

                            {/* Discovered Values */}
                            {Object.keys(video.extracted_data || {}).some(k => !DEFAULT_REAL_ESTATE_COLS.includes(k)) && (
                                <div className="space-y-2 pt-4 border-t border-white/5">
                                    <p className="text-[9px] font-mono text-neon-pink uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <Play size={8} className="fill-neon-pink" /> Discovered Patterns
                                    </p>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                        {Object.entries(video.extracted_data).map(([key, value]) => {
                                            if (DEFAULT_REAL_ESTATE_COLS.includes(key)) return null;
                                            if (value === null) return null;

                                            const isActualValue = value !== "Not mentioned" && value !== "N/A" && value !== "Not found";

                                            return (
                                                <div key={key} className="bg-black/20 border border-white/5 p-2 rounded flex flex-col gap-1">
                                                    <span className="text-[8px] font-mono text-white/30 uppercase">{key}</span>
                                                    <span className={`text-xs font-display ${isActualValue ? 'text-white/90' : 'text-white/20 italic'}`}>
                                                        {value || 'Not mentioned'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 mt-auto space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[8px] font-mono text-white/30 uppercase tracking-tighter">Subroutines Remaining</span>
                                    <span className={`text-[8px] font-mono font-bold ${video.extractions_remaining === 0 ? 'text-red-500' : 'text-neon-cyan'}`}>
                                        {video.extractions_remaining} / 3
                                    </span>
                                </div>
                                {video.error_message && video.error_message.includes('Extraction') && video.status !== 'failed' && (
                                    <div className="px-3 py-2 bg-neon-pink/10 border border-neon-pink/30 rounded flex items-start gap-2 shadow-[0_0_15px_rgba(255,42,109,0.1)] animate-in fade-in duration-500">
                                        <Info className="text-neon-pink shrink-0 mt-0.5" size={12} />
                                        <span className="text-[10px] font-mono text-neon-pink leading-tight">
                                            {video.error_message.replace('Extraction Error: ', '')}
                                        </span>
                                    </div>
                                )}
                                <NeonButton
                                    className="w-full h-10 text-xs tracking-[0.2em]"
                                    variant={video.extractions_remaining === 0 ? "secondary" : "pink"}
                                    onClick={handleExtract}
                                    disabled={selectedColumns.length === 0 || extracting || video.extractions_remaining === 0}
                                >
                                    {extracting ? 'EXTRACTING...' :
                                        video.extractions_remaining === 0 ? 'LIMIT REACHED' : 'EXTRACT SELECTED'}
                                </NeonButton>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center text-white/20 gap-3">
                            <Cpu size={32} className="animate-pulse" />
                            <p className="font-mono text-[10px] uppercase tracking-widest">Awaiting Subroutines...</p>
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
};

export default VideoDetail;
