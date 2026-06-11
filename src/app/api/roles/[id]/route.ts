import { backendRequest } from '@/lib/api/backend-client';
import { getSessionContext } from '@/lib/api/session-context';
import { handleRouteError, jsonResponse } from '@/lib/api/server-utils';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 try {
 const resolvedParams = await params;
 const context = await getSessionContext();
 const body = await request.json();
 const response = await backendRequest({
 method: 'PUT',
 pathCandidates: ['/api/roles/' + resolvedParams.id],
 body,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 try {
 const resolvedParams = await params;
 const context = await getSessionContext();
 const body = await request.json();
 const response = await backendRequest({
 method: 'PATCH',
 pathCandidates: ['/api/roles/' + resolvedParams.id],
 body,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 try {
 const resolvedParams = await params;
 const context = await getSessionContext();
 const response = await backendRequest({
 method: 'DELETE',
 pathCandidates: ['/api/roles/' + resolvedParams.id],
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}
