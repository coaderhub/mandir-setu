import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Organization from '@/models/Organization';

export async function GET() {
  try {
    await connectDB();

    const organizations = await Organization.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.error('Organization fetch error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch organizations',
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      name,
      slug,
      description = '',
      address = '',
      city = '',
      state = '',
      country = 'India',
      phone = '',
      email = '',
    } = body;

    if (!name || !slug) {
      return NextResponse.json(
        {
          success: false,
          message: 'Organization name and slug are required',
        },
        {
          status: 400,
        }
      );
    }

    const existingOrganization = await Organization.findOne({
      slug: slug.toLowerCase().trim(),
    });

    if (existingOrganization) {
      return NextResponse.json(
        {
          success: false,
          message: 'An organization with this slug already exists',
        },
        {
          status: 409,
        }
      );
    }

    const organization = await Organization.create({
      name: name.trim(),
      slug: slug.toLowerCase().trim(),
      description,
      address,
      city,
      state,
      country,
      phone,
      email,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Organization created successfully',
        data: organization,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error('Organization creation error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create organization',
      },
      {
        status: 500,
      }
    );
  }
}