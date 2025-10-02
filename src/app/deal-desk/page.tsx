import {getDeals} from "@/lib/actions/deal-desk.actions";
import {DealsPageClient} from "@/components/deal-desk/deals-page-client";

// Force dynamic rendering to avoid static generation issues with cookies
export const dynamic = 'force-dynamic';

export default async function DealDeskPage() {
    try {
        // Get initial deals data for server-side rendering
        const dealsResponse = await getDeals();
        const {data: initialDeals, metadata: initialMetadata} = dealsResponse;

        return <DealsPageClient initialDeals={initialDeals} initialMetadata={initialMetadata}/>;
    } catch (error) {
        console.error('Error loading deals:', error);
        // Return empty data if API is not available during build
        return <DealsPageClient initialDeals={[]} initialMetadata={{page: 1, totalPages: 1, limit: 10}}/>;
    }
} 