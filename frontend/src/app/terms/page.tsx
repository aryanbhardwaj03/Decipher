import Link from "next/link";
import { ScrollText, CheckCircle2 } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-16 px-4">
      <div className="max-w-3xl w-full space-y-8">
        
        <Link href="/" className="inline-flex items-center text-sm text-primary hover:underline font-medium mb-4">
          &larr; Back to Home
        </Link>
        
        <div className="space-y-4 border-b border-border pb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-2">
            <ScrollText className="w-8 h-8" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">Terms & Conditions</h1>
          <p className="text-lg text-muted-foreground font-light">
            Please read these terms carefully before using Decipher. By using our service, you agree to be bound by these terms.
          </p>
        </div>

        <div className="space-y-8 prose prose-slate dark:prose-invert max-w-none text-foreground/80 leading-relaxed">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Decipher, you accept and agree to be bound by the terms and provisions of this agreement.
              In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" /> 2. User Accounts and Security
            </h2>
            <p>
              To use certain features of the service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. 
              <strong> You are responsible for safeguarding your password and you agree that you will not disclose your password to any third party. </strong>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. User Content and Intellectual Property</h2>
            <p>
              Our platform allows you to upload, submit, store, send or receive content (including PDF documents and generated summaries). 
              <strong> You retain ownership of any intellectual property rights that you hold in that content. </strong>
              We do not claim ownership over any documents you upload, and we do not use your documents to train external public AI models without explicit anonymization and consent.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. Acceptable Use Policy</h2>
            <p>You agree not to use the service to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Upload any content that is unlawful, harmful, threatening, abusive, or otherwise objectionable.</li>
              <li>Impersonate any person or entity, or falsely state or otherwise misrepresent your affiliation with a person or entity.</li>
              <li>Upload any material that contains software viruses or any other computer code designed to interrupt, destroy, or limit the functionality of the service.</li>
              <li>Attempt to gain unauthorized access to the service, other users' accounts, or computer systems or networks connected to the service.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">5. Service Modifications</h2>
            <p>
              We reserve the right at any time to modify or discontinue, temporarily or permanently, the service (or any part thereof) with or without notice. You agree that Decipher shall not be liable to you or to any third party for any modification, suspension or discontinuance of the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">6. Limitation of Liability</h2>
            <p>
              In no event shall Decipher, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
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
