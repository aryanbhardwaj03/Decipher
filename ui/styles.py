"""
Custom CSS Styles for the Streamlit UI.
Premium dark theme with glassmorphism, gradients, and micro-animations.
"""


def get_custom_css() -> str:
    """Return the custom CSS for the app."""
    return """
<style>
    /* ── Import Google Font ───────────────────────────────────────── */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    /* ── Root Variables ───────────────────────────────────────────── */
    :root {
        --bg-primary: #0a0a0f;
        --bg-secondary: #12121a;
        --bg-card: rgba(20, 20, 35, 0.8);
        --bg-glass: rgba(255, 255, 255, 0.03);
        --border-glass: rgba(255, 255, 255, 0.08);
        --text-primary: #e8e8ed;
        --text-secondary: #8b8b9e;
        --text-muted: #5a5a6e;
        --accent-primary: #6c5ce7;
        --accent-secondary: #a29bfe;
        --accent-gradient: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 50%, #74b9ff 100%);
        --success: #00b894;
        --warning: #fdcb6e;
        --danger: #e17055;
        --shadow-glow: 0 0 20px rgba(108, 92, 231, 0.15);
        --radius: 12px;
        --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* ── Global Styles ────────────────────────────────────────────── */
    .stApp {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
    }

    /* ── Header Styling ───────────────────────────────────────────── */
    .app-header {
        background: var(--accent-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-size: 2.2rem;
        font-weight: 700;
        letter-spacing: -0.5px;
        margin-bottom: 0.2rem;
    }

    .app-subtitle {
        color: var(--text-secondary);
        font-size: 0.95rem;
        font-weight: 300;
        margin-bottom: 1.5rem;
    }

    /* ── Glass Card ───────────────────────────────────────────────── */
    .glass-card {
        background: var(--bg-card);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--border-glass);
        border-radius: var(--radius);
        padding: 1.2rem;
        margin-bottom: 1rem;
        transition: var(--transition);
    }

    .glass-card:hover {
        border-color: rgba(108, 92, 231, 0.3);
        box-shadow: var(--shadow-glow);
    }

    /* ── Chat Messages ────────────────────────────────────────────── */
    .chat-user {
        background: linear-gradient(135deg, rgba(108, 92, 231, 0.15) 0%, rgba(162, 155, 254, 0.1) 100%);
        border: 1px solid rgba(108, 92, 231, 0.2);
        border-radius: 16px 16px 4px 16px;
        padding: 1rem 1.2rem;
        margin: 0.5rem 0;
        color: var(--text-primary);
        animation: slideInRight 0.3s ease-out;
    }

    .chat-assistant {
        background: var(--bg-glass);
        border: 1px solid var(--border-glass);
        border-radius: 16px 16px 16px 4px;
        padding: 1rem 1.2rem;
        margin: 0.5rem 0;
        color: var(--text-primary);
        animation: slideInLeft 0.3s ease-out;
    }

    /* ── Status Badge ─────────────────────────────────────────────── */
    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .status-online {
        background: rgba(0, 184, 148, 0.15);
        color: var(--success);
        border: 1px solid rgba(0, 184, 148, 0.3);
    }

    .status-offline {
        background: rgba(225, 112, 85, 0.15);
        color: var(--danger);
        border: 1px solid rgba(225, 112, 85, 0.3);
    }

    /* ── Document Card ────────────────────────────────────────────── */
    .doc-card {
        background: var(--bg-glass);
        border: 1px solid var(--border-glass);
        border-radius: 10px;
        padding: 0.8rem 1rem;
        margin: 0.4rem 0;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: var(--transition);
    }

    .doc-card:hover {
        background: rgba(108, 92, 231, 0.08);
        border-color: rgba(108, 92, 231, 0.2);
    }

    .doc-icon {
        font-size: 1.5rem;
    }

    .doc-info {
        flex: 1;
    }

    .doc-name {
        color: var(--text-primary);
        font-weight: 500;
        font-size: 0.85rem;
    }

    .doc-meta {
        color: var(--text-muted);
        font-size: 0.7rem;
    }

    /* ── Metric Card ──────────────────────────────────────────────── */
    .metric-card {
        background: var(--bg-card);
        border: 1px solid var(--border-glass);
        border-radius: var(--radius);
        padding: 1rem;
        text-align: center;
    }

    .metric-value {
        font-size: 1.8rem;
        font-weight: 700;
        background: var(--accent-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .metric-label {
        color: var(--text-secondary);
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    /* ── Source Citation ───────────────────────────────────────────── */
    .source-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 10px;
        background: rgba(108, 92, 231, 0.1);
        border: 1px solid rgba(108, 92, 231, 0.2);
        border-radius: 6px;
        color: var(--accent-secondary);
        font-size: 0.72rem;
        font-weight: 500;
        margin: 2px;
    }

    /* ── Quiz Card ────────────────────────────────────────────────── */
    .quiz-question {
        background: var(--bg-card);
        border: 1px solid var(--border-glass);
        border-radius: var(--radius);
        padding: 1.2rem;
        margin: 0.8rem 0;
        border-left: 3px solid var(--accent-primary);
    }

    /* ── Animations ───────────────────────────────────────────────── */
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
    }

    @keyframes slideInLeft {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }

    .animate-fade-in {
        animation: fadeIn 0.4s ease-out;
    }

    .pulse {
        animation: pulse 2s infinite;
    }

    /* ── Sidebar Styling ──────────────────────────────────────────── */
    [data-testid="stSidebar"] {
        background: var(--bg-secondary) !important;
        border-right: 1px solid var(--border-glass) !important;
    }

    [data-testid="stSidebar"] .stMarkdown h1,
    [data-testid="stSidebar"] .stMarkdown h2,
    [data-testid="stSidebar"] .stMarkdown h3 {
        background: var(--accent-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    /* ── Tab Styling ──────────────────────────────────────────────── */
    .stTabs [data-baseweb="tab-list"] {
        gap: 4px;
        background: var(--bg-glass);
        border-radius: var(--radius);
        padding: 4px;
        border: 1px solid var(--border-glass);
    }

    .stTabs [data-baseweb="tab"] {
        border-radius: 8px;
        padding: 8px 20px;
        font-weight: 500;
        color: var(--text-secondary);
        transition: var(--transition);
    }

    .stTabs [aria-selected="true"] {
        background: var(--accent-primary) !important;
        color: white !important;
    }

    /* ── File Uploader ────────────────────────────────────────────── */
    [data-testid="stFileUploader"] {
        border: 2px dashed var(--border-glass) !important;
        border-radius: var(--radius) !important;
        transition: var(--transition);
    }

    [data-testid="stFileUploader"]:hover {
        border-color: var(--accent-primary) !important;
    }

    /* ── Button Styling ───────────────────────────────────────────── */
    .stButton > button {
        border-radius: 8px !important;
        font-weight: 500 !important;
        transition: var(--transition) !important;
        border: 1px solid var(--border-glass) !important;
    }

    .stButton > button:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-glow);
    }

    .stButton > button[kind="primary"] {
        background: var(--accent-gradient) !important;
        border: none !important;
        color: white !important;
    }

    /* ── Spinner ──────────────────────────────────────────────────── */
    .loading-dots::after {
        content: '';
        animation: dots 1.5s steps(4, end) infinite;
    }

    @keyframes dots {
        0% { content: ''; }
        25% { content: '.'; }
        50% { content: '..'; }
        75% { content: '...'; }
    }

    /* ── Scrollbar ────────────────────────────────────────────────── */
    ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }

    ::-webkit-scrollbar-track {
        background: transparent;
    }

    ::-webkit-scrollbar-thumb {
        background: rgba(108, 92, 231, 0.3);
        border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: rgba(108, 92, 231, 0.5);
    }

    /* ── Hide default Streamlit elements ──────────────────────────── */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
</style>
"""
