import {getOnboardings} from "@/lib/actions/onboarding.actions";
import {OnboardingsPageClient} from "@/components/onboarding/onboardings-page-client";

export default async function OnboardingPage() {
    const onboardingResults = await getOnboardings({page: 1, limit: 10, orderBy: 'createdAt', orderDirection: 'desc'});
    const {data: onboardings, metadata: metadata} = onboardingResults;

    return <OnboardingsPageClient initialOnboardings={onboardings} initialMetadata={metadata}/>;
} 