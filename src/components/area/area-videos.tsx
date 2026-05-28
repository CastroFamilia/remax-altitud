"use client";

/**
 * AreaVideos — Client Component
 *
 * Renders beautifully styled responsive YouTube video embeds for the area guide.
 */

import { Play } from "lucide-react";

interface AreaVideosProps {
  locale: string;
}

export function AreaVideos({ locale }: AreaVideosProps) {
  const isEs = locale === "es";

  const videos = [
    {
      title: isEs ? "Descubra Pérez Zeledón" : "Discover Pérez Zeledón",
      description: isEs
        ? "Una mirada detallada a la cultura, conectividad y paisajes del valle."
        : "An in-depth look at the culture, connectivity, and landscapes of the valley.",
      embedId: "FYYGJkkPizI",
    },
    {
      title: isEs ? "Casas Rurales en Venta" : "Rural Homes for Sale",
      description: isEs
        ? "Explore propiedades sostenibles, fincas ecológicas y vida barefoot."
        : "Explore sustainable properties, eco-fincas, and barefoot mountain living.",
      embedId: "55qwiPIrtbc",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-border mt-12">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-brand-gold/10 text-brand-gold">
          <Play className="w-5 h-5 fill-current" />
        </div>
        <h2 className="text-3xl font-extrabold text-brand-navy">
          {isEs ? "Videos Destacados de la Zona" : "Featured Area Videos"}
        </h2>
      </div>
      <p className="text-text-muted text-[17px] mb-8 max-w-2xl leading-relaxed">
        {isEs
          ? "Visualice el estilo de vida, los paisajes y las increíbles propiedades rurales que le esperan en esta maravillosa región."
          : "Visualize the lifestyle, landscapes, and incredible rural properties waiting for you in this wonderful region."}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {videos.map((vid, idx) => (
          <div
            key={idx}
            className="flex flex-col rounded-2xl overflow-hidden bg-background border border-border/60 shadow-sm hover:shadow-lg transition-all duration-300 group"
          >
            {/* Responsive Video Container */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${vid.embedId}`}
                title={vid.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
            {/* Info Area */}
            <div className="p-5 bg-gradient-to-r from-background to-secondary/5 flex-grow">
              <h3 className="text-lg font-bold text-brand-navy group-hover:text-brand-gold transition-colors duration-300">
                {vid.title}
              </h3>
              <p className="text-sm text-text-muted mt-2 leading-relaxed">{vid.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
