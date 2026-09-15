import { redirect } from 'next/navigation';

import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Organization from '@/models/Organization';
import { getAuthSession } from '@/lib/auth';

import DashboardShell from './DashboardShell';

export const dynamic =
  'force-dynamic';

export default async function DashboardLayout({
  children,
}) {
  const session =
    await getAuthSession();

  if (!session) {
    redirect('/login');
  }

  await connectDB();

  const user = await User.findOne({
    _id: session.userId,
    organizationId:
      session.organizationId,
  }).lean();

  if (!user) {
    redirect('/login');
  }

  if (user.status !== 'active') {
    redirect('/login');
  }

  const organization =
    await Organization.findById(
      session.organizationId
    ).lean();

  if (!organization) {
    redirect('/login');
  }

  if (
    organization.status &&
    organization.status !== 'active'
  ) {
    redirect('/login');
  }

  const serializedUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId:
      user.organizationId.toString(),
    phone: user.phone || '',
    status:
      user.status || 'active',
  };

  const serializedOrganization = {
    id: organization._id.toString(),
    name: organization.name,
    slug: organization.slug,
    logo: organization.logo || '',
    description:
      organization.description || '',
    address:
      organization.address || '',
    city: organization.city || '',
    state:
      organization.state || '',
    country:
      organization.country || '',
    phone:
      organization.phone || '',
    email:
      organization.email || '',
    status:
      organization.status || 'active',
  };

  return (
    <DashboardShell
      user={serializedUser}
      organization={
        serializedOrganization
      }
    >
      {children}
    </DashboardShell>
  );
}