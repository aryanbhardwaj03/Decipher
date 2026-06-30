const fs = require('fs');
const path = require('path');

const file1 = path.join(__dirname, 'frontend/src/app/dashboard/page.tsx');
let content1 = fs.readFileSync(file1, 'utf-8');

// Replacements
content1 = content1.replace(
  'import { apiGetDocuments, apiDeleteDocument, apiToggleFavorite } from "@/lib/api";',
  'import { apiGetDocuments, apiDeleteDocument, apiToggleFavorite, apiGetXpHistory } from "@/lib/api";'
);

content1 = content1.replace(
  'import type { Document } from "@/types";',
  'import type { Document, XPHistoryResponse } from "@/types";'
);

content1 = content1.replace(
  'const [loading, setLoading] = useState(true);\n  const [showUpload, setShowUpload] = useState(false);',
  'const [loading, setLoading] = useState(true);\n  const [showUpload, setShowUpload] = useState(false);\n  const [xpData, setXpData] = useState<XPHistoryResponse | null>(null);'
);

content1 = content1.replace(
  `  const fetchDocuments = useCallback(async () => {
    try {
      const data = await apiGetDocuments();
      setDocuments(data.documents);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      fetchDocuments();
    }
  }, [authLoading, fetchDocuments]);`,
  `  const fetchDocuments = useCallback(async () => {
    try {
      const data = await apiGetDocuments();
      setDocuments(data.documents);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchXpHistory = useCallback(async () => {
    try {
      if (!isGuest) {
        const data = await apiGetXpHistory();
        setXpData(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [isGuest]);

  useEffect(() => {
    if (!authLoading) {
      fetchDocuments();
      fetchXpHistory();
    }
  }, [authLoading, fetchDocuments, fetchXpHistory]);`
);

const yourProgressSection = `            {/* Your Progress */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
               <h3 className="text-[15px] font-bold text-foreground mb-4">Your Progress</h3>
               <div className="flex items-end gap-2 mb-2">
                 <span className="text-3xl font-extrabold text-foreground">{documents.length}</span>
                 {!isUnlimited && <span className="text-sm text-muted-foreground font-medium mb-1">/ {maxDocs}</span>}
               </div>
               <p className="text-[11px] text-muted-foreground mb-4">Documents processed this week</p>
               
               {isUnlimited ? (
                 <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full mb-2" />
               ) : (
                 <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-2">
                   <div className="h-full bg-primary rounded-full" style={{ width: \`\${Math.min((documents.length / maxDocs) * 100, 100)}%\` }} />
                 </div>
               )}
               
               <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                 {isUnlimited ? (
                   <span className="text-orange-500">Unlimited Storage Unlocked</span>
                 ) : (
                   <span className={documents.length > maxDocs ? "text-red-500" : ""}>
                     {Math.min(Math.round((documents.length / maxDocs) * 100), 100)}% 
                     {documents.length > maxDocs && " (Over Limit)"}
                   </span>
                 )}
               </div>
            </div>`;

const newXpSection = `

            {/* XP & Rewards */}
            {xpData && (
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" /> XP & Rewards
                  </h3>
                  <span className="text-sm font-bold text-primary">{xpData.total_xp} Total XP</span>
                </div>
                
                <div className="mb-4 bg-muted/30 p-3 rounded-xl">
                  <div className="flex justify-between text-xs mb-1 font-medium">
                    <span>Weekly Goal (100 XP)</span>
                    <span className="text-primary">{xpData.weekly_xp} / 100</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: \`\${Math.min((xpData.weekly_xp / 100) * 100, 100)}%\` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Earn 100 XP within a week to automatically upgrade to Plus!
                  </p>
                </div>

                <div className="space-y-3 mt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Sessions</h4>
                  {xpData.history.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Complete quizzes and tasks to earn XP!</p>
                  ) : (
                    xpData.history.slice(0, 4).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-yellow-500/10 flex items-center justify-center">
                            <Plus className="w-3 h-3 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-[12px] font-medium text-foreground">{tx.reason}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className="text-[12px] font-bold text-yellow-600">+{tx.amount} XP</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}`;

content1 = content1.replace(yourProgressSection, yourProgressSection + newXpSection);

fs.writeFileSync(file1, content1, 'utf-8');
console.log('Done');
