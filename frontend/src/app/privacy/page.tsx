import Link from "next/link";
import { Shield, Lock, FileKey } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-16 px-4">
      <div className="max-w-3xl w-full space-y-8">
        
        <Link href="/" className="inline-flex items-center text-sm text-primary hover:underline font-medium mb-4">
          &larr; Back to Home
        </Link>
        
        <div className="space-y-4 border-b border-border pb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-2">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground font-light">
            Your data is yours. We ensure it remains private, secure, and fully under your control.
          </p>
        </div>

        <div className="space-y-8 prose prose-slate dark:prose-invert max-w-none text-foreground/80 leading-relaxed">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" /> 1. We Do Not Sell Your Data
            </h2>
            <p>
              At Decipher, we believe that your documents and the insights derived from them are strictly your intellectual property. 
              <strong> We will never sell, rent, or trade your personal information or uploaded documents to any third parties. </strong>
              Your data remains private and nothing can harm you or your intellectual property.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileKey className="w-5 h-5 text-primary" /> 2. Secure Processing
            </h2>
            <p>
              When you upload documents to our platform, they are processed securely using enterprise-grade encryption both in transit and at rest.
              Once your document is summarized, analyzed, or converted to flashcards, we ensure that access is restricted solely to your authenticated account.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. What Information We Collect</h2>
            <p>We collect only the essential information needed to provide you with the best possible service:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account details:</strong> Email address, name, and profile avatar (if provided).</li>
              <li><strong>Uploaded documents:</strong> The PDFs and text files you upload for analysis.</li>
              <li><strong>Generated content:</strong> Summaries, quizzes, and flashcards created from your documents.</li>
              <li><strong>Usage data:</strong> Standard web analytics and error logs to improve our application stability.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. Complete Data Ownership</h2>
            <p>
              You maintain full ownership of your data at all times. You can export or permanently delete your account and all associated documents from the Settings page. 
              Once deleted, your data is instantly purged from our active databases and cannot be recovered by us or any third party.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">5. Cookies and Local Storage</h2>
            <p>
              We use standard cookies and local storage exclusively to maintain your login session, remember your visual theme preference (light/dark mode), and provide core functionality.
              We do not use intrusive third-party tracking cookies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">6. Contact Us</h2>
            <p>
              If you have any questions or concerns about how we handle your data, please contact our support team. We are committed to transparency and are always happy to help.
            </p>
          </section>
        </div>

        <div className="pt-8 border-t border-border text-sm text-muted-foreground text-center">
          Last updated: {new Date().toLocaleDateString()}
        </div>

      </div>
    </div>
  );
}
