import {getOnboardings} from "@/lib/actions/onboarding.actions";
import {OnboardingsPageClient} from "@/components/onboarding/onboardings-page-client";

// Force dynamic rendering to avoid static generation issues with cookies
export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
    try {
        const onboardingResults = await getOnboardings({page: 1, limit: 10, orderBy: 'createdAt', orderDirection: 'desc'});
        const {data: onboardings, metadata: metadata} = onboardingResults;

        return <OnboardingsPageClient initialOnboardings={onboardings} initialMetadata={metadata}/>;
    } catch (error) {
        console.error('Error loading onboardings:', error);
        // Return empty data if API is not available during build
        return <OnboardingsPageClient initialOnboardings={[]} initialMetadata={{page: 1, totalPages: 1, limit: 10}}/>;
    }
} 