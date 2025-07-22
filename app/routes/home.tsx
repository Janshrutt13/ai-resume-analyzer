import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import { resumes } from "../../constants";
import ResumeCard from "~/components/ResumeCard";


export function meta({}: Route.MetaArgs) {
    return [
        { title: "Resumind" },
        { name: "description", content: "Smart feedback for your dream job" },
    ];
}

export default function Home() {
    return (
        <main className="bg-[url('/assets/images/bg-main.svg')] bg-cover min-h-screen">
            <Navbar />
            <section className="main-section">
                <div className="page-heading">
                    <h1>Track Your Applications and Resume ratings</h1>
                    <h2>Review your submissions and check for ai-powered feedback</h2>
                </div>
            </section>

            {resumes.length > 0 && (
                <div>
                    {resumes.map((resume, index) => (
                        <ResumeCard key={resume.id} resume={resume} />
                    ))}
                </div>
                )}
        </main>
    );
}
