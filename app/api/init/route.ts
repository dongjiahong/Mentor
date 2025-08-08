import { NextResponse } from 'next/server';
import { InitializationService } from '@/services/core';

// 强制动态渲染，避免在构建时执行数据库初始化
export const dynamic = 'force-dynamic'

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