import { getNews, timeAgo } from "@/lib/portfolio/news";

export async function NewsBlock() {
  const items = await getNews(5);

  return (
    <div className="rounded-vault border border-vaulty-line bg-vaulty-surface p-[18px]">
      <div className="mb-3.5 flex items-baseline justify-between border-b border-vaulty-lineSoft pb-2.5">
        <div className="flex items-baseline gap-2.5">
          <div className="font-serif text-[16px] font-medium text-vaulty-ink">
            뉴스
          </div>
          <div className="font-mono text-[9px] tracking-[1.5px] text-vaulty-inkMuted">
            THE WIRE
          </div>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="py-6 text-center font-mono text-[10px] text-vaulty-inkMuted">
          뉴스를 불러올 수 없습니다
        </div>
      ) : (
        items.map((n, i) => (
          <a
            key={n.id}
            href={n.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`block py-2 transition-colors hover:bg-vaulty-surfaceAlt/50 ${
              i < items.length - 1 ? "border-b border-vaulty-lineSoft" : ""
            }`}
          >
            <div className="mb-1 flex items-center gap-1.5 font-mono text-[8px] tracking-[1px] text-vaulty-bronze">
              <span>{n.publisher.toUpperCase()}</span>
              <span className="text-vaulty-inkMuted">·</span>
              <span>{timeAgo(n.publishedAt)}</span>
              {n.relatedName && (
                <>
                  <span className="text-vaulty-inkMuted">·</span>
                  <span className="truncate text-vaulty-inkMuted">
                    {n.relatedName}
                  </span>
                </>
              )}
            </div>
            <div className="line-clamp-2 font-serif text-[12.5px] font-medium leading-snug text-vaulty-ink">
              {n.title}
            </div>
          </a>
        ))
      )}
    </div>
  );
}
