import {
  UniversalContent,
  LearningModule,
  ContentType,
  EnglishLevel,
  ContentSentence,
  ContentDialogue,
  WritingPracticeContent,
  ListeningPracticeContent,
  ReadingPracticeContent,
  DatabaseError,
  DatabaseErrorType
} from '@/types';

/**
 * 统一内容管理服务
 * 负责管理所有学习内容，支持多模块复用
 */
export class ContentManager {
  private contents: Map<string, UniversalContent> = new Map();
  private contentsByType: Map<ContentType, UniversalContent[]> = new Map();
  private contentsByLevel: Map<EnglishLevel, UniversalContent[]> = new Map();
  private contentsByModule: Map<LearningModule, UniversalContent[]> = new Map();

  constructor() {
    this.initializeMaps();
  }

  /**
   * 初始化分类映射
   */
  private initializeMaps(): void {
    // 初始化内容类型映射
    (['article', 'dialogue', 'audio', 'video', 'image', 'mixed'] as ContentType[]).forEach(type => {
      this.contentsByType.set(type, []);
    });

    // 初始化难度级别映射
    (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as EnglishLevel[]).forEach(level => {
      this.contentsByLevel.set(level, []);
    });

    // 初始化模块映射
    (['content', 'listening', 'speaking', 'reading', 'writing'] as LearningModule[]).forEach(module => {
      this.contentsByModule.set(module, []);
    });
  }

  /**
   * 添加内容
   */
  public addContent(content: UniversalContent): void {
    try {
      // 验证内容
      this.validateContent(content);

      // 存储内容
      this.contents.set(content.id, content);

      // 更新分类映射
      this.updateCategoryMappings(content);

    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: `添加内容失败: ${error}`,
        details: { contentId: content.id, error }
      });
    }
  }

  /**
   * 批量添加内容
   */
  public addBatchContent(contents: UniversalContent[]): void {
    contents.forEach(content => {
      this.addContent(content);
    });
  }

  /**
   * 根据ID获取内容
   */
  public getContentById(id: string): UniversalContent | null {
    return this.contents.get(id) || null;
  }

  /**
   * 获取所有内容
   */
  public getAllContent(): UniversalContent[] {
    return Array.from(this.contents.values());
  }

  /**
   * 根据内容类型获取内容
   */
  public getContentByType(type: ContentType): UniversalContent[] {
    return this.contentsByType.get(type) || [];
  }

  /**
   * 根据难度级别获取内容
   */
  public getContentByLevel(level: EnglishLevel): UniversalContent[] {
    return this.contentsByLevel.get(level) || [];
  }

  /**
   * 根据学习模块获取内容
   */
  public getContentByModule(module: LearningModule): UniversalContent[] {
    return this.contentsByModule.get(module) || [];
  }

  /**
   * 根据分类获取内容
   */
  public getContentByCategory(category: string): UniversalContent[] {
    return this.getAllContent().filter(content => content.category === category);
  }

  /**
   * 根据标签获取内容
   */
  public getContentByTags(tags: string[]): UniversalContent[] {
    return this.getAllContent().filter(content => 
      tags.some(tag => content.tags.includes(tag))
    );
  }

  /**
   * 搜索内容
   */
  public searchContent(params: {
    query?: string;
    type?: ContentType;
    level?: EnglishLevel;
    category?: string;
    tags?: string[];
    modules?: LearningModule[];
    limit?: number;
    offset?: number;
  }): {
    contents: UniversalContent[];
    total: number;
  } {
    let results = this.getAllContent();

    // 文本搜索
    if (params.query) {
      const query = params.query.toLowerCase();
      results = results.filter(content => 
        content.title.toLowerCase().includes(query) ||
        content.description.toLowerCase().includes(query) ||
        content.originalText?.toLowerCase().includes(query) ||
        content.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 按类型过滤
    if (params.type) {
      results = results.filter(content => content.contentType === params.type);
    }

    // 按难度过滤
    if (params.level) {
      results = results.filter(content => content.level === params.level);
    }

    // 按分类过滤
    if (params.category) {
      results = results.filter(content => content.category === params.category);
    }

    // 按标签过滤
    if (params.tags && params.tags.length > 0) {
      results = results.filter(content => 
        params.tags!.some(tag => content.tags.includes(tag))
      );
    }

    // 按支持的模块过滤
    if (params.modules && params.modules.length > 0) {
      results = results.filter(content => 
        params.modules!.some(module => content.supportedModules.includes(module))
      );
    }

    const total = results.length;

    // 分页
    if (params.offset !== undefined || params.limit !== undefined) {
      const offset = params.offset || 0;
      const limit = params.limit || 10;
      results = results.slice(offset, offset + limit);
    }

    return { contents: results, total };
  }

  /**
   * 获取推荐内容
   */
  public getRecommendedContent(params: {
    userLevel: EnglishLevel;
    preferredCategories?: string[];
    excludeIds?: string[];
    limit?: number;
  }): UniversalContent[] {
    let candidates = this.getAllContent();

    // 排除指定内容
    if (params.excludeIds && params.excludeIds.length > 0) {
      candidates = candidates.filter(content => 
        !params.excludeIds!.includes(content.id)
      );
    }

    // 计算推荐分数
    const scoredContents = candidates.map(content => ({
      content,
      score: this.calculateRecommendationScore(content, params)
    }));

    // 按分数排序
    scoredContents.sort((a, b) => b.score - a.score);

    // 应用限制
    const limit = params.limit || 10;
    return scoredContents.slice(0, limit).map(item => item.content);
  }

  /**
   * 获取统计信息
   */
  public getStatistics(): {
    totalContents: number;
    contentsByType: Record<ContentType, number>;
    contentsByLevel: Record<EnglishLevel, number>;
    contentsByModule: Record<LearningModule, number>;
    averageDuration: number;
    totalDuration: number;
  } {
    const totalContents = this.contents.size;
    
    // 按类型统计
    const contentsByType = {} as Record<ContentType, number>;
    this.contentsByType.forEach((contents, type) => {
      contentsByType[type] = contents.length;
    });

    // 按难度统计
    const contentsByLevel = {} as Record<EnglishLevel, number>;
    this.contentsByLevel.forEach((contents, level) => {
      contentsByLevel[level] = contents.length;
    });

    // 按模块统计
    const contentsByModule = {} as Record<LearningModule, number>;
    this.contentsByModule.forEach((contents, module) => {
      contentsByModule[module] = contents.length;
    });

    // 时长统计
    const allContents = this.getAllContent();
    const totalDuration = allContents.reduce((sum, content) => sum + content.estimatedDuration, 0);
    const averageDuration = totalContents > 0 ? totalDuration / totalContents : 0;

    return {
      totalContents,
      contentsByType,
      contentsByLevel,
      contentsByModule,
      averageDuration,
      totalDuration
    };
  }

  /**
   * 删除内容
   */
  public removeContent(id: string): boolean {
    const content = this.contents.get(id);
    if (!content) {
      return false;
    }

    // 从主存储中删除
    this.contents.delete(id);

    // 从分类映射中删除
    this.removeCategoryMappings(content);

    return true;
  }

  /**
   * 更新内容
   */
  public updateContent(id: string, updates: Partial<UniversalContent>): UniversalContent | null {
    const existingContent = this.contents.get(id);
    if (!existingContent) {
      return null;
    }

    // 先从映射中删除旧内容
    this.removeCategoryMappings(existingContent);

    // 更新内容
    const updatedContent = {
      ...existingContent,
      ...updates,
      id, // 确保ID不被修改
      updatedAt: new Date()
    };

    // 验证更新后的内容
    this.validateContent(updatedContent);

    // 更新存储
    this.contents.set(id, updatedContent);

    // 更新映射
    this.updateCategoryMappings(updatedContent);

    return updatedContent;
  }

  /**
   * 清空所有内容
   */
  public clear(): void {
    this.contents.clear();
    this.initializeMaps();
  }

  // ============================================================================
  // 私有辅助方法
  // ============================================================================

  /**
   * 验证内容
   */
  private validateContent(content: UniversalContent): void {
    if (!content.id || !content.title || !content.contentType) {
      throw new Error('内容必须包含ID、标题和类型');
    }

    if (!content.supportedModules || content.supportedModules.length === 0) {
      throw new Error('内容必须支持至少一个学习模块');
    }

    // 根据内容类型验证特定字段
    switch (content.contentType) {
      case 'article':
        if (!content.originalText) {
          throw new Error('文章类型内容必须包含原文文本');
        }
        break;
      case 'audio':
        if (!content.audioUrl) {
          throw new Error('音频类型内容必须包含音频URL');
        }
        break;
      case 'video':
        if (!content.videoUrl) {
          throw new Error('视频类型内容必须包含视频URL');
        }
        break;
      case 'dialogue':
        if (!content.conversations || content.conversations.length === 0) {
          throw new Error('对话类型内容必须包含对话内容');
        }
        break;
    }
  }

  /**
   * 更新分类映射
   */
  private updateCategoryMappings(content: UniversalContent): void {
    // 更新类型映射
    const typeContents = this.contentsByType.get(content.contentType) || [];
    typeContents.push(content);
    this.contentsByType.set(content.contentType, typeContents);

    // 更新难度映射
    const levelContents = this.contentsByLevel.get(content.level) || [];
    levelContents.push(content);
    this.contentsByLevel.set(content.level, levelContents);

    // 更新模块映射
    content.supportedModules.forEach(module => {
      const moduleContents = this.contentsByModule.get(module) || [];
      moduleContents.push(content);
      this.contentsByModule.set(module, moduleContents);
    });
  }

  /**
   * 从分类映射中删除
   */
  private removeCategoryMappings(content: UniversalContent): void {
    // 从类型映射中删除
    const typeContents = this.contentsByType.get(content.contentType) || [];
    const typeIndex = typeContents.findIndex(c => c.id === content.id);
    if (typeIndex > -1) {
      typeContents.splice(typeIndex, 1);
    }

    // 从难度映射中删除
    const levelContents = this.contentsByLevel.get(content.level) || [];
    const levelIndex = levelContents.findIndex(c => c.id === content.id);
    if (levelIndex > -1) {
      levelContents.splice(levelIndex, 1);
    }

    // 从模块映射中删除
    content.supportedModules.forEach(module => {
      const moduleContents = this.contentsByModule.get(module) || [];
      const moduleIndex = moduleContents.findIndex(c => c.id === content.id);
      if (moduleIndex > -1) {
        moduleContents.splice(moduleIndex, 1);
      }
    });
  }

  /**
   * 计算推荐分数
   */
  private calculateRecommendationScore(
    content: UniversalContent,
    params: {
      userLevel: EnglishLevel;
      preferredCategories?: string[];
    }
  ): number {
    let score = 0;

    // 难度匹配分数
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const userLevelIndex = levelOrder.indexOf(params.userLevel);
    const contentLevelIndex = levelOrder.indexOf(content.level);
    
    // 优先推荐当前级别或稍高一级的内容
    const levelDiff = Math.abs(contentLevelIndex - userLevelIndex);
    if (levelDiff === 0) {
      score += 10; // 完全匹配
    } else if (levelDiff === 1 && contentLevelIndex > userLevelIndex) {
      score += 8; // 稍高一级
    } else if (levelDiff === 1 && contentLevelIndex < userLevelIndex) {
      score += 6; // 稍低一级
    } else {
      score -= levelDiff * 2; // 差异越大分数越低
    }

    // 分类偏好分数
    if (params.preferredCategories && params.preferredCategories.includes(content.category)) {
      score += 5;
    }

    // 内容质量分数（基于字数和时长的合理性）
    if (content.wordCount && content.estimatedDuration) {
      const wordsPerMinute = content.wordCount / content.estimatedDuration;
      if (wordsPerMinute >= 100 && wordsPerMinute <= 300) {
        score += 3; // 合理的阅读速度
      }
    }

    // 多媒体内容加分
    if (content.audioUrl) score += 2;
    if (content.videoUrl) score += 2;
    if (content.imageUrl) score += 1;

    // 支持多个模块的内容加分
    score += content.supportedModules.length;

    return Math.max(0, score); // 确保分数不为负
  }
}

// 创建全局单例实例
export const contentManager = new ContentManager();