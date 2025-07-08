import { getAccountDetails } from "@/lib/actions/accounts.actions";
import { AccountDetailClient } from "@/components/customer-accounts/account-detail-client";
import { notFound } from "next/navigation";

interface AccountDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountDetailPage({ params }: AccountDetailPageProps) {
  const { id } = await params;
  
  let accountDetails;
  
  try {
    accountDetails = await getAccountDetails(id);
  } catch (error) {
    console.error('Error fetching account details:', error);
    notFound();
  }

  if (!accountDetails) {
    notFound();
  }

  return <AccountDetailClient account={accountDetails} />;
} 