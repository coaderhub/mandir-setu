import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/mongodb';
import Organization from '@/models/Organization';

export async function GET() {
  try {
    await connectDB();

    const organizations = await Organization.find({
      status: { $ne: 'inactive' },
    })
      .select(
        'name slug logo description address city state country phone email'
      )
      .sort({ name: 1 })
      .lean();

    const temples = organizations.map((organization) => ({
      id: organization._id.toString(),
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo || '',
      description: organization.description || '',
      address: organization.address || '',
      city: organization.city || '',
      state: organization.state || '',
      country: organization.country || '',
      phone: organization.phone || '',
      email: organization.email || '',
    }));

    return NextResponse.json({
      success: true,
      data: {
        temples,
        count: temples.length,
      },
    });
  } catch (error) {
    console.error('Public temples API error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to load temples',
      },
      { status: 500 }
    );
  }
}