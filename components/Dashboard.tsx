
import React, { useState } from 'react';
import type { TranslationSet } from '../types';

interface ToolConfig {
    key: string;
    category: string;
    iconClass: string;
    description: string;
    users: string;
    rating: number;
}

interface ActivityItem {
    id: string;
    title: string;
    time: string;
    status: string;
    icon: string;
    tool: string;
}

interface DashboardProps {
    t: TranslationSet;
    tools: ToolConfig[];
    recentActivity: ActivityItem[];
    setActiveTool: (tool: string) => void;
    searchQuery: string;
}

const Dashboard: React.FC<DashboardProps> = ({ t, tools, recentActivity, setActiveTool, searchQuery }) => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showAd, setShowAd] = useState(true);

    const filteredTools = tools.filter(tool => {
        const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
        const matchesSearch = tool.key.toLowerCase().includes(searchQuery.toLowerCase()) || tool.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <>
            {showAd && (
                <div className="advertisement">
                    <div className="ad-content">
                        <i className="fas fa-crown ad-icon"></i>
                        <div>
                            <div className="ad-title">{t.upgradeToPro || "Upgrade to Pro"}</div>
                            <div className="ad-description">{t.unlockPremium || "Unlock all premium features and unlimited processing"}</div>
                        </div>
                    </div>
                    <button className="ad-close" onClick={() => setShowAd(false)}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            )}

            <section className="categories">
                <div className="category-tabs">
                    <button className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>All Tools</button>
                    <button className={`category-tab ${selectedCategory === 'media' ? 'active' : ''}`} onClick={() => setSelectedCategory('media')}>Media</button>
                    <button className={`category-tab ${selectedCategory === 'text' ? 'active' : ''}`} onClick={() => setSelectedCategory('text')}>Text & Language</button>
                    <button className={`category-tab ${selectedCategory === 'productivity' ? 'active' : ''}`} onClick={() => setSelectedCategory('productivity')}>Productivity</button>
                    <button className={`category-tab ${selectedCategory === 'development' ? 'active' : ''}`} onClick={() => setSelectedCategory('development')}>Development</button>
                    <button className={`category-tab ${selectedCategory === 'data' ? 'active' : ''}`} onClick={() => setSelectedCategory('data')}>Data & Analytics</button>
                </div>
            </section>

            <section className="quick-actions">
                <h2 className="quick-actions-title">
                    <i className="fas fa-bolt"></i>
                    Quick Actions
                </h2>
                <div className="quick-actions-grid">
                    <button className="quick-action-btn" onClick={() => setActiveTool('AI Transcriber')}>
                        <i className="fas fa-upload"></i>
                        <span>Upload Files</span>
                    </button>
                    <button className="quick-action-btn">
                        <i className="fas fa-history"></i>
                        <span>Recent Projects</span>
                    </button>
                    <button className="quick-action-btn">
                        <i className="fas fa-star"></i>
                        <span>Favorites</span>
                    </button>
                    <button className="quick-action-btn">
                        <i className="fas fa-cog"></i>
                        <span>Settings</span>
                    </button>
                </div>
            </section>

            <section className="tools-grid">
                {filteredTools.map(tool => (
                    <div key={tool.key} className="tool-card" onClick={() => setActiveTool(tool.key)}>
                        <div className="tool-header">
                            <div className="tool-icon">
                                <i className={tool.iconClass}></i>
                            </div>
                            <div className="tool-info">
                                <h3 className="tool-name">{tool.key}</h3>
                                <span className="tool-category">{tool.category}</span>
                            </div>
                        </div>
                        <p className="tool-description">{tool.description}</p>
                        <div className="tool-stats">
                            <span className="tool-stat">
                                <i className="fas fa-users"></i>
                                {tool.users} users
                            </span>
                            <span className="tool-stat">
                                <i className="fas fa-star"></i>
                                {tool.rating}
                            </span>
                        </div>
                    </div>
                ))}
            </section>

            <section className="recent-activity">
                <h2 className="recent-activity-title">
                    <i className="fas fa-clock"></i>
                    {t.recentActivity || "Recent Activity"}
                </h2>
                <div className="activity-list">
                    {recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
                        <div key={idx} className="activity-item" onClick={() => setActiveTool(activity.tool)}>
                            <div className="activity-icon">
                                <i className={`fas ${activity.icon}`}></i>
                            </div>
                            <div className="activity-details">
                                <div className="activity-title">{activity.title}</div>
                                <div className="activity-time">{activity.time}</div>
                            </div>
                            <span className="activity-status status-completed">{activity.status}</span>
                        </div>
                    )) : (
                        <p className="text-gray-500 text-center py-4">No recent activity</p>
                    )}
                </div>
            </section>
        </>
    );
};

export default Dashboard;
