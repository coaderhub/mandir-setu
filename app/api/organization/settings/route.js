import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/mongodb';
import Organization from '@/models/Organization';
import { requireRole } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    const auth = await requireRole(['admin']);

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }

    await connectDB();

    const organization =
      await Organization.findById(
        auth.session.organizationId
      ).lean();

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          message: 'Organization not found',
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: organization._id.toString(),

        name:
          organization.name,

        slug:
          organization.slug,

        logo:
          organization.logo || '',

        description:
          organization.description || '',

        address:
          organization.address || '',

        city:
          organization.city || '',

        state:
          organization.state || '',

        country:
          organization.country || '',

        phone:
          organization.phone || '',

        email:
          organization.email || '',

        publicSettings: {
          showDonations:
            organization.publicSettings
              ?.showDonations ?? true,

          showDonorNames:
            organization.publicSettings
              ?.showDonorNames ?? false,

          showDonationAmounts:
            organization.publicSettings
              ?.showDonationAmounts ?? false,

          showBalance:
            organization.publicSettings
              ?.showBalance ?? false,
        },

        status:
          organization.status || 'active',
      },
    });
  } catch (error) {
    console.error(
      'Organization settings fetch error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to fetch organization settings',
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireRole(['admin']);

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }

    await connectDB();

    const body =
      await request.json();

    const {
      name,
      slug,
      logo,
      description,
      address,
      city,
      state,
      country,
      phone,
      email,
      publicSettings,
    } = body;

    if (
      !name ||
      !name.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Temple name is required',
        },
        {
          status: 400,
        }
      );
    }

    if (
      !slug ||
      !slug.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Temple slug is required',
        },
        {
          status: 400,
        }
      );
    }

    const normalizedSlug =
      slug
        .toLowerCase()
        .trim();

    /*
     * Check whether another organization
     * is already using this slug.
     */
    const existingOrganization =
      await Organization.findOne({
        slug: normalizedSlug,

        _id: {
          $ne:
            auth.session
              .organizationId,
        },
      });

    if (existingOrganization) {
      return NextResponse.json(
        {
          success: false,
          message:
            'This public slug is already in use',
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Only accept known public settings.
     * Never allow arbitrary fields.
     */
    const safePublicSettings = {
      showDonations:
        publicSettings
          ?.showDonations ?? true,

      showDonorNames:
        publicSettings
          ?.showDonorNames ?? false,

      showDonationAmounts:
        publicSettings
          ?.showDonationAmounts ?? false,

      showBalance:
        publicSettings
          ?.showBalance ?? false,
    };

    /*
     * Load the current organization BEFORE
     * updating it so we can store oldValues.
     */
    const currentOrganization =
      await Organization.findById(
        auth.session.organizationId
      ).lean();

    if (!currentOrganization) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Organization not found',
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Capture only the settings fields
     * that are actually being managed.
     */
    const oldValues = {
      name:
        currentOrganization.name || '',

      slug:
        currentOrganization.slug || '',

      logo:
        currentOrganization.logo || '',

      description:
        currentOrganization.description || '',

      address:
        currentOrganization.address || '',

      city:
        currentOrganization.city || '',

      state:
        currentOrganization.state || '',

      country:
        currentOrganization.country || '',

      phone:
        currentOrganization.phone || '',

      email:
        currentOrganization.email || '',

      publicSettings: {
        showDonations:
          currentOrganization
            .publicSettings
            ?.showDonations ?? true,

        showDonorNames:
          currentOrganization
            .publicSettings
            ?.showDonorNames ?? false,

        showDonationAmounts:
          currentOrganization
            .publicSettings
            ?.showDonationAmounts ?? false,

        showBalance:
          currentOrganization
            .publicSettings
            ?.showBalance ?? false,
      },
    };

    /*
     * Update organization.
     */
    const organization =
      await Organization.findByIdAndUpdate(
        auth.session.organizationId,
        {
          $set: {
            name:
              name.trim(),

            slug:
              normalizedSlug,

            logo:
              typeof logo === 'string'
                ? logo.trim()
                : '',

            description:
              typeof description === 'string'
                ? description.trim()
                : '',

            address:
              typeof address === 'string'
                ? address.trim()
                : '',

            city:
              typeof city === 'string'
                ? city.trim()
                : '',

            state:
              typeof state === 'string'
                ? state.trim()
                : '',

            country:
              typeof country === 'string'
                ? country.trim()
                : 'India',

            phone:
              typeof phone === 'string'
                ? phone.trim()
                : '',

            email:
              typeof email === 'string'
                ? email
                    .toLowerCase()
                    .trim()
                : '',

            publicSettings:
              safePublicSettings,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      ).lean();

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Organization not found',
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Capture the new organization values.
     */
    const newValues = {
      name:
        organization.name || '',

      slug:
        organization.slug || '',

      logo:
        organization.logo || '',

      description:
        organization.description || '',

      address:
        organization.address || '',

      city:
        organization.city || '',

      state:
        organization.state || '',

      country:
        organization.country || '',

      phone:
        organization.phone || '',

      email:
        organization.email || '',

      publicSettings: {
        showDonations:
          organization
            .publicSettings
            ?.showDonations ?? true,

        showDonorNames:
          organization
            .publicSettings
            ?.showDonorNames ?? false,

        showDonationAmounts:
          organization
            .publicSettings
            ?.showDonationAmounts ?? false,

        showBalance:
          organization
            .publicSettings
            ?.showBalance ?? false,
      },
    };

    /*
     * Create audit log.
     */
    await createAuditLog({
      organizationId:
        auth.session
          .organizationId,

      userId:
        auth.session.userId,

      action:
        'SETTINGS_UPDATE',

      module:
        'settings',

      recordId:
        organization._id.toString(),

      description:
        `Updated settings for "${organization.name}"`,

      oldValues,

      newValues,
    });

    return NextResponse.json({
      success: true,

      message:
        'Organization settings updated successfully',

      data: {
        id:
          organization._id.toString(),

        name:
          organization.name,

        slug:
          organization.slug,

        logo:
          organization.logo || '',

        description:
          organization.description || '',

        address:
          organization.address || '',

        city:
          organization.city || '',

        state:
          organization.state || '',

        country:
          organization.country || '',

        phone:
          organization.phone || '',

        email:
          organization.email || '',

        publicSettings: {
          showDonations:
            organization
              .publicSettings
              ?.showDonations ?? true,

          showDonorNames:
            organization
              .publicSettings
              ?.showDonorNames ?? false,

          showDonationAmounts:
            organization
              .publicSettings
              ?.showDonationAmounts ?? false,

          showBalance:
            organization
              .publicSettings
              ?.showBalance ?? false,
        },

        status:
          organization.status ||
          'active',
      },
    });
  } catch (error) {
    console.error(
      'Organization settings update error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to update organization settings',
        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }
}