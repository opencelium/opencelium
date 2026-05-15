import {EntityText} from "@shared/ui/primitives/Text";
import { Link } from 'react-router-dom';


interface Recommendation {
    title: string
    link: string
}

export function RecommendationTags({
    items,
}: {
    items: Recommendation[]
}) {
    if (!items?.length) return null

    return (
        <div style={{ marginLeft: 20, marginTop: 50 }}>
            <div
                style={{
                    fontSize: 14,
                    color: "#888",
                    marginBottom: 12,
                    textAlign: 'left'
                }}
            >
                You may also want to:
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                }}
            >
                {items.map((item) => {
                    return (
                        <Link
                            key={item.link}
                            to={item.link}
                            style={{
                                padding: "6px 14px",
                                borderRadius: 20,
                                border: "1px solid #E0E0E0",
                                textDecoration: "none",
                                fontSize: 13,
                                color: "#6F4FF2",
                                transition: "all 0.2s ease",
                            }}
                        >
                            <EntityText i18nKey={item.title}/>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
