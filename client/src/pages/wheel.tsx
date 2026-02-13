import Layout from "@/components/layout";
import { Link } from "wouter";
import { SEO } from "@/components/seo";
import { WheelComponent } from "@/components/tools/WheelComponent";
import { motion } from "framer-motion";
import { AdBanner } from "@/components/AdBanner";
import { Sparkles } from "lucide-react";
import { InstagramFunnel } from "@/components/tools/InstagramFunnel";
import { RelatedTools } from "@/components/RelatedTools";

export default function WheelPage() {
    const faqStructuredData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "How do I use the Wheel of Names?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Simply enter your list of names or items in the box, and click the Spin button. The wheel will rotate and land on a random winner."
                }
            },
            {
                "@type": "Question",
                "name": "Is the wheel truly random?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our wheel uses a cryptographic random number generator to ensure 100% fairness for every spin."
                }
            },
            {
                "@type": "Question",
                "name": "Is spin the wheel free?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Our spin the wheel tool is 100% free. No signup, no login, no payment required. Use it as much as you like."
                }
            },
            {
                "@type": "Question",
                "name": "Do I need to sign up to spin the wheel?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. You can spin the wheel instantly without creating an account or logging in. Just enter names and click spin."
                }
            }
        ]
    };

    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "PickUsAWinner Spin the Wheel - Random Name Generator",
        applicationCategory: "UtilitiesApplication",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: "Free spin the wheel tool. Random name generator to pick winners. No signup, no login.",
        url: "https://pickusawinner.com/wheel",
    };

    return (
        <Layout>
            <SEO
                title="Spin the Wheel | Random Name Generator - No Signup, No Login"
                description="Free spin the wheel tool. Random name generator to pick winners. No signup, no login. Enter names, spin the wheel, get a random result. For giveaways, raffles, classroom, decisions."
                url="/wheel"
                keywords="spin the wheel, wheel of names, random name generator, spin wheel random, decision wheel, raffle wheel, pick a winner, no login"
                structuredData={faqStructuredData}
                additionalStructuredData={[webAppSchema]}
            />

            <div className="max-w-6xl mx-auto space-y-12 pb-12">
                {/* Header */}
                <div className="text-center space-y-4 pt-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-[#FFDA44] border-2 border-black px-4 py-1 font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] transform -rotate-1"
                    >
                        <Sparkles className="w-5 h-5" /> No Signup, No Login
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter">
                        Wheel of <span className="text-primary text-stroke-sm">Names</span>
                    </h1>
                    <p className="text-lg md:text-xl font-medium text-muted-foreground max-w-2xl mx-auto px-4">
                        The easiest way to pick a random winner. Enter names, spin the wheel, and let fate decide!
                    </p>
                </div>

                {/* Main Tool Area */}
                <div className="px-4">
                    <WheelComponent />
                </div>

                <InstagramFunnel />

                <section className="container mx-auto px-4">
                    <AdBanner type="adsense" className="w-full" />
                </section>

                {/* SEO Content Section */}
                <div className="grid md:grid-cols-2 gap-8 px-4 py-8 bg-white border-y-4 border-black">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black uppercase">Free Spin the Wheel - Random Name Generator</h2>
                        <p className="text-lg leading-relaxed">
                            Our <strong>spin the wheel</strong> tool is a free <strong>random name generator</strong> that lets you pick a winner from any list.
                            Enter names, spin the wheel, and get a random result. No signup, no login. Perfect for classroom activities, raffles, giveaways, or making a decision.
                            For Instagram giveaways, try our <Link href="/tool" className="text-primary font-bold underline hover:no-underline">Instagram Giveaway Generator</Link>. Prefer a list? Use our <Link href="/picker" className="text-primary font-bold underline hover:no-underline">Random Name Picker</Link>.
                        </p>
                        <h3 className="text-xl font-bold uppercase mt-6">Popular Uses:</h3>
                        <ul className="list-disc pl-5 space-y-2 font-medium">
                            <li>Picking a winner for a giveaway</li>
                            <li>Selecting a student to answer a question</li>
                            <li>Deciding what to eat for dinner</li>
                            <li>Randomizing teams or groups</li>
                            <li>Truth or Dare games</li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black uppercase">How to Use</h2>
                        <ol className="list-decimal pl-5 space-y-4 text-lg font-medium">
                            <li>
                                <strong>Add Names:</strong> Type names into the input box on the left.
                            </li>
                            <li>
                                <strong>Customize:</strong> You can add as many names as you like.
                            </li>
                            <li>
                                <strong>Spin:</strong> Click the "SPIN IT!" button to rotate the wheel.
                            </li>
                            <li>
                                <strong>Winner:</strong> The wheel will slow down and land on a random segment.
                            </li>
                        </ol>
                        <p className="mt-4 p-4 bg-secondary border-2 border-black font-bold">
                            Tip: You can shuffle the names before spinning for extra randomness!
                        </p>
                        <RelatedTools excludePath="/wheel" max={3} className="mt-8 pt-6 border-t-2 border-black" />
                    </div>
                </div>

            </div>
        </Layout>
    );
}
