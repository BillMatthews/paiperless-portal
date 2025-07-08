import {getDeals} from "@/lib/actions/deal-desk.actions";
import {DealsPageClient} from "@/components/deal-desk/deals-page-client";

export default async function DealDeskPage() {
    // Get initial deals data for server-side rendering
    const dealsResponse = await getDeals();
    const {data: initialDeals, metadata: initialMetadata} = dealsResponse;

    return <DealsPageClient initialDeals={initialDeals} initialMetadata={initialMetadata}/>;
} 