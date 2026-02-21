import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import StatusBadge from '../components/ui/StatusBadge';
import { UploadCloud, Play, FileVideo, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            const { data } = await client.get('/videos');
            setVideos(data.items || []);
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error('Failed to retrieve video feed');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        const toastId = toast.loading('Initiating Uplink...');

        try {
            await client.post('/videos/upload', formData);
            toast.success('Uplink Successful', { id: toastId });
            setShowUpload(false);
            fetchVideos();
        } catch (error) {
            console.error("Upload error:", error);
            toast.error('Uplink Failed', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                    <h2 className="text-3xl font-display font-bold tracking-wider text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                        DASHBOARD
                    </h2>
                    <p className="text-neon-cyan/60 font-mono text-sm mt-1">SECURE TRANSMISSION LOG</p>
                </div>
                <NeonButton onClick={() => setShowUpload(!showUpload)} variant={showUpload ? "pink" : "cyan"}>
                    {showUpload ? <span className="flex items-center gap-2"><X size={16} /> Abort</span> : <span className="flex items-center gap-2"><UploadCloud size={16} /> New Uplink</span>}
                </NeonButton>
            </div>

            {/* Upload Zone */}
            {showUpload && (
                <GlassCard className="p-8 border-dashed border-2 border-neon-cyan/30 bg-neon-cyan/5 flex flex-col items-center justify-center gap-4 transition-all duration-500 animate-pulse-slow">
                    <div className="w-16 h-16 rounded-full bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/50 shadow-[0_0_20px_rgba(5,217,232,0.2)]">
                        <UploadCloud size={32} className="text-neon-cyan" />
                    </div>
                    <h3 className="text-xl font-display text-white">Holo-Drop Zone</h3>
                    <p className="text-white/50 text-sm">Drag manifest here or click to select stream</p>
                    <input
                        type="file"
                        onChange={handleUpload}
                        className="hidden"
                        id="file-upload"
                        accept="video/*"
                        disabled={uploading}
                    />
                    <NeonButton
                        variant="cyan"
                        disabled={uploading}
                        onClick={() => document.getElementById('file-upload').click()}
                    >
                        {uploading ? 'Transmitting...' : 'Select File'}
                    </NeonButton>
                    {uploading && <div className="w-full max-w-md h-1 bg-gray-700 rounded-full overflow-hidden relative">
                        <div className="absolute inset-y-0 left-0 bg-neon-cyan animate-[width_2s_ease-in-out_infinite] w-1/2 shadow-[0_0_10px_#05d9e8]" />
                    </div>}
                </GlassCard>
            )}

            {/* Video Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-white/30 font-display">
                            NO DATA STREAMS FOUND
                        </div>
                    ) : (
                        videos.map(video => (
                            <Link key={video.id} to={`/video/${video.id}`} className="group block">
                                <GlassCard className="h-full flex flex-col overflow-hidden group-hover:border-neon-cyan transition-all duration-300">
                                    <div className="relative aspect-video bg-black/50 overflow-hidden flex items-center justify-center border-b border-white/10 group-hover:border-neon-cyan/30 transition-colors">
                                        {video.thumbnail_url ? (
                                            <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-white/20 group-hover:text-neon-cyan/80 transition-colors">
                                                <FileVideo size={48} />
                                                <span className="text-xs font-mono uppercase tracking-widest">No Signal</span>
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/80 to-transparent opacity-60" />

                                        <div className="absolute bottom-3 right-3">
                                            <StatusBadge status={video.status} />
                                        </div>

                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="w-12 h-12 rounded-full bg-neon-cyan/20 backdrop-blur-md border border-neon-cyan flex items-center justify-center shadow-[0_0_20px_rgba(5,217,232,0.5)]">
                                                <Play className="text-white ml-1" size={24} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 flex flex-col flex-grow">
                                        <h3 className="font-display font-bold text-lg mb-1 truncate text-white group-hover:text-neon-cyan transition-colors">
                                            {video.title || `Stream ${video.id.substring(0, 8)}`}
                                        </h3>
                                        {video.description && (
                                            <p className="text-sm font-mono text-white/70 mb-2 line-clamp-2 leading-relaxed">
                                                {video.description}
                                            </p>
                                        )}
                                        <p className="text-xs font-mono text-white/40 mb-4">
                                            ID: {video.id}
                                        </p>
                                        <div className="mt-auto flex justify-between items-center text-[10px] text-white/50 border-t border-white/10 pt-3">
                                            <span>{new Date(video.created_at).toLocaleString()}</span>
                                            <span className="font-mono text-neon-pink/80 uppercase tracking-widest">
                                                {video.status === 'completed' ? 'READY' : 'PROCESSING'}
                                            </span>
                                        </div>
                                    </div>
                                </GlassCard>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
