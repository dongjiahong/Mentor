import { NextResponse } from 'next/server';
import { InitializationService } from '@/services/core';

export async function GET() {
  try {
    await InitializationService.initialize();
    
    return NextResponse.json({
      success: true,
      message: '系统初始化完成'
    });
  } catch (error) {
    console.error('系统初始化失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '初始化失败' 
    }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}