import React, { useState } from 'react';
import { Sparkles, Heart, Feather, ShieldCheck, ArrowRight } from 'lucide-react';

export function StoryPage({ onNavigateToShop }) {
  const [activeTexture, setActiveTexture] = useState(0);

  const textures = [
    {
      title: "The Relief Seed Stitch",
      yarn: "Hand-Dyed Organic Merino Wool",
      hours: "5.5 Hours per Motif",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHwtqSmwPaSvvRpSkfHi4nFMO4V8b0mxN5_UANwuPz8DeWadaI1vWEWQ7gMAqnaC6cb6KL4Nam3givx7g3Yr2Ii4WgKJh7fQRAfYTs8hlCdre94QrgIjpueAj_K7tR9eb71cmNgvaNxCWphz7xMWo6ngjt1asvvKzY8kGKUFSCRx79JR6cBSk57XcfCT2VfJwIMwbpzz_AV_HYkF7nqwAUVHaQY9yIBwdzb9keFl4rUURcnAtzm8Wpe3MmI-EDe6jdhrs",
      notes: "Creates a three-dimensional spiral topology that mirrors the golden-ratio geometry of natural sunflowers."
    },
    {
      title: "Velvet Micro-Loop Seaming",
      yarn: "Mulberry Silk & Pima Cotton Blend",
      hours: "7.0 Hours per Arrangement",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDd-Z9FKQEqLMSctYI9Sq3o05hpPALgXJRsmL4WgHEmXFMnrOlYG9-FUvrtjXP9fBn35MYTMAec0mp_bUb4xrbotW0tyjLroFEvvfXnZG7BGru-WNtuA_EIgln6BrJjYoUpbk3SM6tsiRpBd2VAeVS3kkLxzvcDWcETlH4sLtDzYYKBvIRy7VN-0R5_5oaiMSjxqlEOcbyOWRpPlIy0ahe-vXE4UUXSpXyhlt4lA5Dl0NImoSBbl3G-TvQ8hRV51_jqwHo",
      notes: "Tightly wound double-crochet loops wrapped seamlessly around inner copper stems to form rigid, lifelike petals."
    },
    {
      title: "Chunky Braided Cord Tension",
      yarn: "12mm Braided Organic Cotton",
      hours: "11.0 Hours per Tote",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB5kZyQ97kUe_dT6FeshODHNLNzURhregWAKdZqtuXl0kdIEvWsFyii4QjXDWLAPJyJQIt4AZznUgwLgjQTTXID4MrXt-Va7-DNmD-y1NJer3XikHKR-hp_R55rejMBxs2N0cOR9hfZw9NUNMotnpUlVUWkbQMcNsto2kaxa9G_yJNafbZlYuup3g2Cr71Wg6VnQNxupSAZ4xeFeA8t8j_oPNpnMA6R21-Se4kaGlj_nwdeRpIaYq4mHg",
      notes: "High-tension structural crochet providing self-supporting volume without plastic frames or synthetic resins."
    }
  ];

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-20 space-y-24">
      {/* Editorial Hero */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-surface-container rounded-full border border-primary/20 text-xs text-primary font-semibold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Luxe Craft Manifesto</span>
        </div>
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-on-background tracking-tight leading-tight">
          Slow Fashion, Stitch by Stitch.
        </h1>
        <p className="font-body text-base md:text-lg text-on-surface-variant leading-relaxed">
          We reject the ephemeral speed of industrial production. At Luxe Craft, luxury is measured not in mass output, but in the hours of silent contemplation, tensioned fingers, and master craftsmanship poured into every single thread.
        </p>
      </section>

      {/* Brand Pillars Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: Feather,
            title: "Ethical & Organic Fibers",
            desc: "Every yarn in our atelier is GOTS-certified unbleached organic cotton, cruelty-free merino wool, or pure mulberry silk sourced from heritage Italian and Egyptian mills."
          },
          {
            icon: Heart,
            title: "Unbroken Provenance",
            desc: "Each creation is signed with a numbered brass tag linking directly to the individual master artisan who brought it to life over hours of patient stitching."
          },
          {
            icon: ShieldCheck,
            title: "Heirloom Longevity",
            desc: "Our structural knotting techniques ensure your crochet pieces maintain their shape and vibrant botanical hues for generations, supported by our lifetime care pledge."
          }
        ].map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div
              key={idx}
              className="bg-surface-container-low p-8 rounded border border-outline-variant/20 space-y-4 hover:border-primary/40 transition-colors duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary border border-primary/20">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-headline text-xl text-on-surface">{pillar.title}</h3>
              <p className="font-body text-xs md:text-sm text-on-surface-variant leading-relaxed">
                {pillar.desc}
              </p>
            </div>
          );
        })}
      </section>

      {/* Interactive Texture Loom Gallery */}
      <section className="bg-surface-container-low p-8 md:p-12 rounded-lg border border-outline-variant/20 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/10 pb-6">
          <div>
            <span className="font-label text-xs uppercase tracking-widest text-primary font-semibold">Interactive Studio Study</span>
            <h2 className="font-display text-2xl md:text-3xl text-on-background mt-1">The Loom Gallery: Macro Textures</h2>
          </div>
          <div className="flex gap-2">
            {textures.map((t, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTexture(idx)}
                className={`px-3 py-1.5 rounded text-xs font-label uppercase tracking-wider transition-colors ${
                  activeTexture === idx
                    ? 'bg-primary text-on-primary font-bold'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Study 0{idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-6 relative aspect-[4/5] rounded overflow-hidden bg-surface-variant border border-outline-variant/20 shadow-2xl">
            <img
              src={textures[activeTexture].image}
              alt={textures[activeTexture].title}
              className="w-full h-full object-cover transition-all duration-700"
            />
          </div>

          <div className="md:col-span-6 space-y-6">
            <h3 className="font-headline text-2xl md:text-3xl text-on-surface">
              {textures[activeTexture].title}
            </h3>

            <div className="space-y-3 text-xs bg-surface-container p-5 rounded border border-outline-variant/15">
              <div>
                <span className="text-on-surface-variant font-label uppercase tracking-wider block mb-1">Material Integrity:</span>
                <span className="text-on-surface font-semibold text-sm">{textures[activeTexture].yarn}</span>
              </div>
              <div className="pt-2 border-t border-outline-variant/10">
                <span className="text-on-surface-variant font-label uppercase tracking-wider block mb-1">Time Investment:</span>
                <span className="text-primary font-semibold text-sm">{textures[activeTexture].hours}</span>
              </div>
            </div>

            <p className="font-body text-sm text-on-surface-variant leading-relaxed">
              {textures[activeTexture].notes}
            </p>

            <button
              onClick={onNavigateToShop}
              className="px-6 py-3 bg-on-background hover:bg-primary-fixed text-background hover:text-on-primary-fixed font-label text-xs uppercase tracking-widest font-semibold rounded flex items-center gap-2 transition-colors"
            >
              <span>Explore Collection Pieces</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
