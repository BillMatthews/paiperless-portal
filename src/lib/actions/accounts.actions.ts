"use server";

import {AccountsSearchResponse, SearchOptions} from "@/lib/types/search.types";
import {AccountDetailsDto, AccountUpdatesDto} from "@/lib/types/accounts.types";
import {apiGet, apiPatch} from "@/lib/utils/api-client";
import { handleServerActionError } from "@/lib/utils/error-handler";

const apiUrl = process.env.TRADE_DOCUMENTS_API_URL || 'http://localhost:3001/api';

export async function searchAccounts(options: SearchOptions = {}): Promise<AccountsSearchResponse> {
    try {
      const { queryTerm, page, limit, orderBy, orderDirection } = options;
      
      // Build query parameters
      const params = new URLSearchParams();
      if (queryTerm) params.append('queryTerm', queryTerm);
      if (page !== undefined) params.append('page', page.toString());
      if (limit !== undefined) params.append('limit', limit.toString());
      if (orderBy) params.append('orderBy', orderBy);
      if (orderDirection) params.append('orderDirection', orderDirection);
      
      const queryString = params.toString();
      const url = queryString ? `${apiUrl}/accounts?${queryString}` : `${apiUrl}/accounts`;
  
      console.log('Fetching accounts from:', url);
  
      const response = await apiGet(url);
  
      if (!response.ok) {
        throw new Error(`Failed to fetch accounts: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log('Accounts response:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      return await handleServerActionError(error, 'searchAccounts');
    }
  }

export async function updateAccountDetails(accountId: string, updates: AccountUpdatesDto): Promise<AccountDetailsDto> {
  if (!apiUrl) {
    console.error('TRADE_DOCUMENTS_API_URL environment variable is not set');
    throw new Error('API configuration is missing. Please check environment variables.');
  }

  try {
    const url = `${apiUrl}/accounts/${accountId}`

    console.log('Updating account:', accountId, 'with updates:', updates);

    const response = await apiPatch(url, JSON.stringify(updates));

    if (!response.ok) {
      throw new Error(`Failed to update account: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Account update response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    return await handleServerActionError(error, 'updateAccountDetails');
  }
}

export async function updateAccountStatus(accountId: string, updates: AccountUpdatesDto): Promise<AccountDetailsDto> {
  if (!apiUrl) {
    console.error('TRADE_DOCUMENTS_API_URL environment variable is not set');
    throw new Error('API configuration is missing. Please check environment variables.');
  }

  try {
    const url = `${apiUrl}/accounts/${accountId}/status`

    console.log('Updating account:', accountId, 'with updates:', updates);

    const response = await apiPatch(url,JSON.stringify(updates));

    if (!response.ok) {
      throw new Error(`Failed to update account: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Account update response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    return await handleServerActionError(error, 'updateAccountStatus');
  }
}

export async function getAccountDetails(accountId: string): Promise<AccountDetailsDto> {
  if (!apiUrl) {
    console.error('TRADE_DOCUMENTS_API_URL environment variable is not set');
    throw new Error('API configuration is missing. Please check environment variables.');
  }

  try {
    const url = `${apiUrl}/accounts/${accountId}`

    const response = await apiGet(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch account details: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    return await handleServerActionError(error, 'getAccountDetails');
  }
}