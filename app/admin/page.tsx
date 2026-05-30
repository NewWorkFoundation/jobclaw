import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_COOKIE_NAME, isAdminAuthConfigured, isValidAdminPassword } from "@/lib/admin";
import { intakeQuestions } from "@/lib/jobclaw";
import { getSubmissionStoreLabel, listSubmissions } from "@/lib/submissions";

export const dynamic = "force-dynamic";

type AdminDashboardPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    password?: string | string[];
    token?: string | string[];
  }>;
};

async function signInAdmin(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");

  if (!isValidAdminPassword(password)) {
    redirect("/admin?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, password, {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/admin");
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const params = await searchParams;

  if (!isAdminAuthConfigured()) {
    const isProduction = process.env.NODE_ENV === "production";

    return (
      <main className="min-h-[100dvh] brand-bg px-4 py-10 sm:px-8">
        <nav aria-label="Main links" className="mx-auto mb-10 flex w-full max-w-3xl">
          <Link className="text-sm font-bold text-foreground underline-offset-4 hover:underline sm:text-base" href="/">
            JobClaw
          </Link>
        </nav>
        <section className="mx-auto grid w-full max-w-3xl gap-12">
          <Card className="border-border/70 shadow-lg">
            <CardHeader className="space-y-3 p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Administrator dashboard
              </p>
              <CardTitle className="text-3xl font-bold tracking-tight">Admin is not configured.</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                {isProduction ? (
                  <>
                    Set <strong>ADMIN_DASHBOARD_TOKEN</strong> in your hosting environment (for example Vercel) to a
                    new long random secret before using this page. The previous default password was removed from the
                    codebase and must be rotated.
                  </>
                ) : (
                  <>
                    Add <strong>ADMIN_DASHBOARD_TOKEN</strong> to <code className="text-sm">.env.local</code> to sign in
                    locally.
                  </>
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </main>
    );
  }

  const queryPassword = getFirstParam(params.password) ?? getFirstParam(params.token);
  const cookieStore = await cookies();
  const cookiePassword = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isValidAdminPassword(queryPassword) && !isValidAdminPassword(cookiePassword)) {
    return (
      <main className="min-h-[100dvh] brand-bg px-4 py-10 sm:px-8">
        <nav aria-label="Main links" className="mx-auto mb-10 flex w-full max-w-3xl">
          <Link className="text-sm font-bold text-foreground underline-offset-4 hover:underline sm:text-base" href="/">
            JobClaw
          </Link>
        </nav>
        <section className="mx-auto grid w-full max-w-3xl gap-12">
          <Card className="border-border/70 shadow-lg">
            <CardHeader className="space-y-3 p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Administrator dashboard
              </p>
              <CardTitle className="text-3xl font-bold tracking-tight">Admin access required.</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Enter the admin password to view people, assessments, and contact information at this URL.
              </CardDescription>
            </CardHeader>
            <CardContent className="border-t border-border/60 px-10 pb-8 pt-8">
              <form action={signInAdmin} className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground" htmlFor="admin-password">
                    Password
                  </Label>
                  <Input
                    autoComplete="current-password"
                    className="h-11 rounded-xl"
                    id="admin-password"
                    name="password"
                    placeholder="Enter admin password"
                    type="password"
                  />
                </div>
                {getFirstParam(params.error) ? (
                  <p className="text-sm text-destructive">That password did not match.</p>
                ) : null}
                <Button type="submit" className="h-11 w-fit rounded-2xl cta-glow">
                  Open admin page
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  const submissions = await listSubmissions();
  const submissionStoreLabel = getSubmissionStoreLabel();
  const contactedCount = submissions.filter(
    (submission) => submission.contact.name || submission.contact.email || submission.contact.phone,
  ).length;

  return (
    <main className="min-h-[100dvh] brand-bg px-4 py-8 sm:px-8 md:pb-24">
      <nav aria-label="Main links" className="mx-auto mb-12 flex w-full max-w-[1180px]">
        <Link className="text-sm font-bold text-foreground underline-offset-4 hover:underline sm:text-base" href="/">
          JobClaw
        </Link>
      </nav>

      <section className="mx-auto grid w-full max-w-[1180px] gap-14">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-5 p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Administrator dashboard
            </p>
            <CardTitle className="text-balance text-3xl font-bold tracking-tight sm:text-[2rem] md:text-[2.25rem]">
              People, assessments, and contact info.
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-relaxed">
              Review completed chat intakes, follow-up details, inferred roles, and profile assessments in one
              place.
            </CardDescription>
            <p className="text-sm font-medium text-muted-foreground">
              Storage: <span className="text-card-foreground">{submissionStoreLabel}</span>
            </p>
          </CardHeader>

          <CardContent className="border-t border-border/60 px-10 pb-10 pt-10">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard title="Total intakes" value={submissions.length} />
              <MetricCard title="With contact info" value={contactedCount} />
              <MetricCard
                title="With archetype"
                value={submissions.filter((submission) => submission.profileDraft?.archetype?.name).length}
              />
            </div>
          </CardContent>
        </Card>

        {submissions.length > 0 ? (
          <div className="grid gap-14">
            {submissions.map((submission) => (
              <article key={submission.id} className="rounded-3xl border border-border/70 bg-card shadow-sm">
                <CardHeader className="flex flex-col gap-12 border-border/55 p-10 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(submission.createdAt))}
                    </p>
                    <CardTitle className="mt-4 text-2xl">{submission.contact.name || "Unnamed person"}</CardTitle>
                    <CardDescription className="mt-3 text-base">{submission.result.summary}</CardDescription>
                  </div>
                  <Card className="w-full shrink-0 border-border/60 bg-muted/60 shadow-none md:max-w-sm">
                    <CardContent className="grid gap-2 p-8 text-base">
                      <p className="m-0 break-all font-medium">{submission.contact.email || "No email"}</p>
                      <p className="m-0 break-all">{submission.contact.phone || "No phone"}</p>
                    </CardContent>
                  </Card>
                </CardHeader>

                <CardContent className="grid gap-12 border-border/55 px-10 py-14 md:grid-cols-2 md:divide-x md:divide-border/40 lg:divide-x lg:divide-border/35">
                  <section className="md:pr-10">
                    <h3 className="mb-6 text-xl font-semibold tracking-tight">Assessment</h3>
                    <dl className="grid grid-cols-[max-content,minmax(0,1fr)] gap-x-4 gap-y-4 text-[0.875rem]">
                      <AssessmentRow dt="Archetype" dd={submission.profileDraft?.archetype?.name || "Not generated"} />
                      <AssessmentRow
                        dt="Ideal job"
                        dd={
                          submission.profileDraft?.idealJob?.title ||
                          submission.result.searchRequest?.jobTitle ||
                          "Not generated"
                        }
                      />
                      <AssessmentRow
                        dt="Headline"
                        dd={submission.profileDraft?.linkedInProfile?.headline || "Not generated"}
                      />
                      <AssessmentRow dt="Location" dd={submission.defaults.location || "Any"} />
                      <AssessmentRow dt="Work mode" dd={submission.defaults.workMode} />
                    </dl>
                  </section>

                  <section className="md:pl-12">
                    <h3 className="mb-6 text-xl font-semibold tracking-tight">Contact</h3>
                    <dl className="grid grid-cols-[max-content,minmax(0,1fr)] gap-x-4 gap-y-4 text-[0.875rem]">
                      <AssessmentRow dt="Name" dd={submission.contact.name || "Not provided"} />
                      <AssessmentRow dt="Email" dd={submission.contact.email || "Not provided"} />
                      <AssessmentRow dt="Phone" dd={submission.contact.phone || "Not provided"} />
                      <AssessmentRow dt="Raw entry" dd={submission.contact.raw || "Not provided"} />
                    </dl>
                  </section>
                </CardContent>

                <CardFooter className="flex-col items-stretch gap-14 border-border/55 px-10 pb-12 pt-2">
                  <details className="border-t border-border/60 pt-12">
                    <summary className="cursor-pointer pb-12 text-xl font-bold">View chat answers</summary>
                    <div className="grid gap-5">
                      {intakeQuestions.map((question) => (
                        <div className="rounded-2xl border border-border bg-card p-[18px]" key={question.id}>
                          <p className="m-0 text-[0.855rem] font-bold text-muted-foreground">{question.label}</p>
                          <p className="m-0 mt-3 whitespace-pre-wrap text-[0.935rem] leading-relaxed">{submission.answers[question.id]}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                </CardFooter>
              </article>
            ))}
          </div>
        ) : (
          <Card className="rounded-3xl border border-dashed border-border/65 bg-muted/55 p-14 text-center shadow-none">
            <CardHeader className="p-2">
              <CardTitle className="text-3xl tracking-tight">No submissions yet.</CardTitle>
            </CardHeader>
            <CardContent className="px-12 pb-2 pt-4">
              <CardDescription className="text-[1rem] leading-relaxed">
                Completed chat intakes will appear here after someone finishes the contact step and JobClaw
                generates an assessment.
              </CardDescription>
            </CardContent>
            <CardFooter className="mt-11 justify-center p-8">
              <Button asChild type="button" className="rounded-2xl cta-glow">
                <Link href="/intake">Open intake</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </section>
    </main>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-[22px] border border-border/70 bg-muted/70 p-[18px]">
      <strong className="block text-[2rem] tracking-[-0.05em] text-foreground">{value}</strong>
      <span className="block text-[0.9rem] leading-relaxed text-muted-foreground">{title}</span>
    </div>
  );
}

function AssessmentRow({ dt, dd }: { dt: string; dd: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{dt}</dt>
      <dd className="break-words">{dd}</dd>
    </>
  );
}

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
