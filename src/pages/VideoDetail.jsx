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
    const [revealedAi, setRevealedAi] = useState(false);
    const [suggestingMore, setSuggestingMore] = useState(false);

    // Persist revealed state if data already exists
    useEffect(() => {
        if (video?.extracted_data && Object.keys(video.extracted_data).some(k => !DEFAULT_REAL_ESTATE_COLS.includes(k))) {
            setRevealedAi(true);
        }
    }, [video?.extracted_data]);

    const handleRevealAi = () => {
        setRevealedAi(true);
        if (suggestions.filter(c => !DEFAULT_REAL_ESTATE_COLS.includes(c)).length === 0) {
            handleSuggestMore();
        }
    };

    const handleSuggestMore = async () => {
        setSuggestingMore(true);
        const toastId = toast.loading('Discovery subroutine connecting...');
        try {
            const { data } = await client.post(`/extractions/suggest-more/${id}`);
            if (data.suggested_columns) {
                setSuggestions(prev => {
                    const allCols = [...new Set([...DEFAULT_REAL_ESTATE_COLS, ...prev, ...data.suggested_columns])];
                    return allCols;
                });
            }
            toast.success("Additional patterns discovery complete", { id: toastId });
        } catch (error) {
            console.error("Error suggesting more columns", error);
            toast.error("Discovery Subroutine Interrupted", { id: toastId });
        } finally {
            setSuggestingMore(false);
        }
    };

    const handleTranslate = async () => {
        setTranslating(true);
        const toastId = toast.loading('Initializing universal translator...');
        try {
            const { data } = await client.post(`/videos/${id}/translate`);
            setTranslatedText(data.translated_text);
            toast.success("Signal Translated to English", { id: toastId });
        } catch (error) {
            console.error("Translation error", error);
            toast.error("Universal Translator Offline", { id: toastId });
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
                // toast.error("Signal Lost"); // Removed to prevent spam during polling
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
        const toastId = toast.loading('Initiating deep extraction...');
        try {
            await client.post(`/extractions/extract/${id}`, {
                selected_columns: selectedColumns
            });
            toast.success("Extraction Subroutine Queued", { id: toastId });
            setSelectedColumns([]); // Clear them so they aren't stuck for next round
        } catch (error) {
            console.error("Extraction error", error);
            toast.error("Extraction Failed", { id: toastId });
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
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none z-10">
                            <div className="text-center space-y-4">
                                <Cpu className="mx-auto text-neon-cyan animate-pulse" size={48} />
                                <h3 className="text-xl font-display text-white tracking-widest animate-pulse">
                                    {video.status === 'transcribing' ? 'DECODING AUDIO STREAM' : 'EXTRACTING PATTERNS'}
                                </h3>
                                <div className="flex flex-col gap-1">
                                    <p className="text-neon-cyan/70 font-mono text-[10px] tracking-[0.3em] uppercase">
                                        PLEASE WAIT...
                                    </p>
                                    <div className="w-32 h-1 bg-white/10 mx-auto rounded-full overflow-hidden">
                                        <div className="h-full bg-neon-cyan animate-shimmer" />
                                    </div>
                                </div>
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
                            <span className="flex items-center gap-1">NODE: <span className="text-neon-cyan/80">{video.id.substring(0, 8)}</span></span>
                            <span>|</span>
                            <span>{new Date(video.created_at).toLocaleDateString()} {new Date(video.created_at).toLocaleTimeString()}</span>
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
                                <NeonButton variant="cyan" onClick={handleTranslate} disabled={translating} className="h-9 text-[10px] tracking-widest px-4">
                                    {translating ? 'CONNECTING...' : 'TRANSLATE TO ENGLISH'}
                                </NeonButton>
                            )}
                        </h3>
                        <GlassCard className="p-6 relative max-h-[400px] overflow-y-auto custom-scrollbar border-white/5 bg-white/[0.02]">
                            <p className="font-mono text-sm leading-relaxed text-white/80 whitespace-pre-wrap selection:bg-neon-cyan/30">
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
            <div className="space-y-6 lg:max-h-[calc(100vh-10rem)] overflow-y-auto pr-2 custom-scrollbar pb-10">
                {/* BOX 1: CORE REAL ESTATE SPECS */}
                <GlassCard className="p-5 border-neon-cyan/20 flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-neon-cyan/10 transition-all duration-700" />

                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                        <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                            <Database className="text-neon-cyan" size={18} />
                            CORE SPECS
                        </h2>
                        <span className="text-[8px] font-mono text-neon-cyan/50 tracking-widest uppercase animate-pulse">
                            {video.status === 'completed' ? 'SYNCHRONIZED' : 'PROCESSING'}
                        </span>
                    </div>

                    <div className="space-y-2.5">
                        {DEFAULT_REAL_ESTATE_COLS.map(col => {
                            const value = video.extracted_data?.[col];
                            const hasKey = video.extracted_data && col in video.extracted_data;
                            const isActualValue = hasKey && value !== "Not mentioned" && value !== "N/A" && value !== "Not found";

                            return (
                                <div key={col} className="flex flex-col gap-1 p-2.5 rounded bg-white/[0.03] border border-white/[0.03] hover:border-neon-cyan/30 hover:bg-white/[0.05] transition-all duration-300 group/item">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/40 font-mono text-[9px] uppercase tracking-wider group-hover/item:text-white/60 transition-colors">{col}</span>
                                        {!hasKey && isProcessing && (
                                            <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-neon-cyan/40 animate-shimmer" />
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-xs font-display transition-all duration-300 ${isActualValue ? 'text-white' : 'text-white/20 italic'}`}>
                                        {!hasKey ? (isProcessing ? 'SCANNING...' : 'NOT FOUND') : value || 'Not mentioned'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>

                {/* BOX 2: AI PATTERN DISCOVERY */}
                <GlassCard className={`p-5 flex flex-col relative transition-all duration-500 overflow-hidden ${revealedAi ? 'border-neon-pink/30' : 'border-white/10'}`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] pointer-events-none transition-all duration-500 ${revealedAi ? 'bg-neon-pink/10' : 'bg-white/5'}`} />

                    <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                        <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                            <Layers className={revealedAi ? 'text-neon-pink' : 'text-white/30'} size={18} />
                            AI DISCOVERY
                        </h2>
                        {revealedAi && isReadyForExtraction && (
                            <div className="flex flex-col items-end">
                                <button
                                    onClick={handleSuggestMore}
                                    disabled={suggestingMore || video.suggestions_remaining === 0 || extracting}
                                    className="text-[10px] font-mono text-neon-pink hover:text-white transition-colors flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed group/btn"
                                >
                                    {suggestingMore ? <Cpu size={10} className="animate-spin" /> : <><Cpu size={10} className="group-hover/btn:animate-pulse" /> + Suggest patterns</>}
                                </button>
                                <span className="text-[8px] font-mono text-white/30 uppercase tracking-tighter">
                                    {video.suggestions_remaining} CYCLES REMAINING
                                </span>
                            </div>
                        )}
                    </div>

                    {!revealedAi ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center gap-6 relative z-10">
                            <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center relative group/reveal cursor-pointer" onClick={handleRevealAi}>
                                <div className="absolute inset-0 rounded-full bg-neon-pink/5 group-hover/reveal:bg-neon-pink/20 transition-all duration-500 group-hover/reveal:scale-110" />
                                <Cpu size={32} className="text-white/20 group-hover/reveal:text-neon-pink transition-all duration-500" />
                                <div className="absolute -inset-1 border border-neon-pink/0 group-hover/reveal:border-neon-pink/40 rounded-full animate-ping-slow pointer-events-none" />
                            </div>
                            <div className="space-y-2">
                                <p className="font-mono text-[10px] uppercase text-white/40 tracking-[0.2em]">Deeper patterns detected</p>
                                <p className="text-[9px] text-white/20 italic max-w-[180px] mx-auto">AI has identified additional hidden property signals in this stream.</p>
                            </div>
                            <NeonButton variant="pink" className="h-10 text-[10px] tracking-widest px-8" onClick={handleRevealAi}>
                                REVEAL INSIGHTS
                            </NeonButton>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in transition-all duration-1000">
                            {/* Discovery Buttons */}
                            <div className="space-y-3">
                                <p className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] flex justify-between items-center">
                                    <span>SELECT PATTERNS</span>
                                    {isReadyForExtraction && <span className="text-neon-pink/60">{video.extractions_remaining} / 3 SUBROUTINES LEFT</span>}
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
                                                        px-3 py-1.5 rounded-full text-[9px] font-mono border transition-all duration-300
                                                        ${isExtracted ? 'bg-neon-pink/5 border-neon-pink/20 text-neon-pink/40 cursor-default' :
                                                            isSelected ? 'bg-neon-pink/20 border-neon-pink text-white shadow-[0_0_15px_rgba(255,42,109,0.4)]' :
                                                                'bg-white/5 border-white/10 text-gray-400 hover:border-neon-pink/40 hover:text-white'}
                                                    `}
                                                >
                                                    {col} {isExtracted && '✓'}
                                                </button>
                                            );
                                        }) : (
                                            <div className="w-full py-6 text-center bg-black/20 rounded border border-dashed border-white/5">
                                                <p className="text-white/30 italic text-[10px] font-mono">Scanning for deeper patterns...</p>
                                            </div>
                                        )
                                    }
                                </div>
                            </div>

                            {/* Discovered Values */}
                            {Object.keys(video.extracted_data || {}).some(k => !DEFAULT_REAL_ESTATE_COLS.includes(k)) && (
                                <div className="space-y-3 pt-4 border-t border-white/10">
                                    <p className="text-[9px] font-mono text-neon-pink uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-neon-pink animate-pulse" />
                                        ACTIVATE INSIGHTS
                                    </p>
                                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                                        {Object.entries(video.extracted_data || {}).map(([key, value]) => {
                                            if (DEFAULT_REAL_ESTATE_COLS.includes(key)) return null;
                                            if (value === null) return null;

                                            const isActualValue = value !== "Not mentioned" && value !== "N/A" && value !== "Not found" && value !== "Extraction failed";

                                            return (
                                                <div key={key} className="bg-white/[0.03] border border-white/5 p-3 rounded hover:bg-white/[0.05] transition-all group/insight">
                                                    <span className="text-[8px] font-mono text-white/30 uppercase group-hover/insight:text-neon-pink/50 transition-colors">{key}</span>
                                                    <div className={`text-xs mt-1 font-display leading-relaxed ${isActualValue ? 'text-white' : 'text-white/20 italic'}`}>
                                                        {value || 'Not mentioned'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 mt-auto space-y-4">
                                {video.error_message && video.error_message.includes('Extraction') && video.status !== 'failed' && (
                                    <div className="px-3 py-3 bg-neon-pink/10 border border-neon-pink/30 rounded flex items-start gap-3 shadow-[0_0_15px_rgba(255,42,109,0.1)] animate-in slide-in-from-bottom-2 duration-500">
                                        <Info className="text-neon-pink shrink-0 mt-0.5" size={14} />
                                        <span className="text-[10px] font-mono text-neon-pink leading-tight">
                                            {video.error_message.replace('Extraction Error: ', '')}
                                        </span>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Operation Pipeline</span>
                                        <span className={`text-[9px] font-mono font-bold ${video.extractions_remaining === 0 ? 'text-red-500' : 'text-neon-pink'}`}>
                                            {video.extractions_remaining} / 3 SUBROUTINES
                                        </span>
                                    </div>
                                    <NeonButton
                                        className="w-full h-12 text-[10px] tracking-[0.3em] font-bold"
                                        variant={video.extractions_remaining === 0 ? "secondary" : "pink"}
                                        onClick={handleExtract}
                                        disabled={selectedColumns.length === 0 || extracting || video.extractions_remaining === 0}
                                    >
                                        {extracting ? 'PROCESSOR BUSY...' :
                                            video.extractions_remaining === 0 ? 'PIPELINE DEPLETED' : 'INITIATE EXTRACTION'}
                                    </NeonButton>
                                </div>
                            </div>
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
};

export default VideoDetail;
