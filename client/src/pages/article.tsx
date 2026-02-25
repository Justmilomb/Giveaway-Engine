import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import Layout from "@/components/layout";
import { SEO } from "@/components/seo";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Home, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Article {
  title: string;
  slug: string;
  description: string;
  keywords: string;
  publishDate: string;
  lastModified: string;
  category: string;
  schemaType: "Article" | "Review" | "HowTo";
  readingTime: string;
  content: string;
  html: string;
}

interface ArticleListing {
  title: string;
  slug: string;
  description: string;
  category: string;
  readingTime: string;
}

export default function ArticlePage() {
  const [, params] = useRoute("/article/:slug");
  const slug = params?.slug || "";

  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<ArticleListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadArticle() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/articles/${slug}`);
        if (!response.ok) {
          throw new Error("Article not found");
        }

        const data = await response.json();
        setArticle(data.article);
        setRelated(data.related || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load article");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadArticle();
    }
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading article...</p>
        </div>
      </Layout>
    );
  }

  if (error || !article) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
          <h1 className="text-4xl font-black uppercase">Article Not Found</h1>
          <p className="text-slate-600">{error || "The article you're looking for doesn't exist."}</p>
          <Link href="/">
            <Button>
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // Generate structured data based on article type
  const getStructuredData = () => {
    const baseData = {
      "@context": "https://schema.org",
      headline: article.title,
      description: article.description,
      author: {
        "@type": "Organization",
        "name": "PickUsAWinner",
      },
      publisher: {
        "@type": "Organization",
        "name": "PickUsAWinner",
      },
      datePublished: article.publishDate,
      dateModified: article.lastModified,
      url: `https://pickusawinner.com/article/${article.slug}`,
    };

    if (article.schemaType === "HowTo") {
      return {
        ...baseData,
        "@type": "HowTo",
      };
    } else if (article.schemaType === "Review") {
      return {
        ...baseData,
        "@type": "Review",
        itemReviewed: {
          "@type": "SoftwareApplication",
          name: "PickUsAWinner",
        },
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
      };
    } else {
      return {
        ...baseData,
        "@type": "Article",
      };
    }
  };

  // Breadcrumb structured data
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://pickusawinner.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: article.category,
        item: `https://pickusawinner.com/article/category/${article.category.toLowerCase()}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `https://pickusawinner.com/article/${article.slug}`,
      },
    ],
  };

  return (
    <Layout>
      <SEO
        title={article.title}
        description={article.description}
        keywords={article.keywords}
        url={`/article/${article.slug}`}
        structuredData={[getStructuredData(), breadcrumbData]}
      />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-slate-600 font-medium">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-400">{article.category}</span>
          <span>/</span>
          <span className="text-black">{article.title}</span>
        </nav>

        {/* Article Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-4 text-sm">
            <span className="bg-primary text-white px-3 py-1 font-bold uppercase border-2 border-black">
              {article.category}
            </span>
            <div className="flex items-center gap-1 text-slate-600">
              <Clock className="w-4 h-4" />
              <span>{article.readingTime}</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase italic tracking-tighter">
            {article.title}
          </h1>

          <p className="text-lg text-slate-700 font-medium leading-relaxed">
            {article.description}
          </p>

          <div className="text-sm text-slate-500">
            Published: {new Date(article.publishDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {article.lastModified !== article.publishDate && (
              <span className="ml-4">
                Updated: {new Date(article.lastModified).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
        </motion.div>

        {/* Article Content */}
        {/* SECURITY NOTE: Articles are admin-controlled markdown files, not user-generated content.
            HTML is sanitized by remark-html during server-side processing. */}
        <motion.article
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="prose prose-slate prose-lg max-w-none border-4 border-black bg-white p-8 shadow-neo"
        >
          <div dangerouslySetInnerHTML={{ __html: article.html }} />
        </motion.article>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="border-4 border-black bg-primary text-white p-8 shadow-neo text-center space-y-4"
        >
          <h3 className="text-2xl font-black uppercase">Ready to Pick Your Winner?</h3>
          <p className="text-lg font-medium opacity-90">
            Use our free Instagram comment picker tool to select fair random winners instantly
          </p>
          <Link href="/tool">
            <Button variant="secondary" size="lg">
              Launch Picker Tool
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>

        {/* Related Articles */}
        {related.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <Tag className="w-6 h-6" />
              <h2 className="text-3xl font-black uppercase">Related Articles</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {related.map((relatedArticle) => (
                <Link
                  key={relatedArticle.slug}
                  href={`/article/${relatedArticle.slug}`}
                  className="border-4 border-black bg-white p-6 shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group"
                >
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase text-primary">
                      {relatedArticle.category}
                    </span>
                    <h3 className="text-xl font-black uppercase group-hover:text-primary transition-colors">
                      {relatedArticle.title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {relatedArticle.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {relatedArticle.readingTime}
                      </span>
                      <span className="text-primary font-bold">Read more →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
