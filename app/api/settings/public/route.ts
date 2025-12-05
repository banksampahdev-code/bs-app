import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Get public settings (no authentication required)
export async function GET() {
  try {
    const data = await prisma.appSetting.findMany({
      where: { setting_key: { in: ['app_download_link', 'cs_whatsapp_number'] } },
      orderBy: { setting_key: 'asc' },
    });

    // Convert array to object for easier access
    const settings: Record<string, any> = {};
    data?.forEach((setting) => {
      settings[setting.setting_key] = {
        value: setting.setting_value,
        description: setting.description
      };
    });

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Public settings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
