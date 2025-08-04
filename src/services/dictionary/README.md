# 词典服务 (Dictionary Service)

词典服务提供了单词查询、释义显示、查询历史记录和缓存功能，支持有道词典API和模拟服务。

## 功能特性

- ✅ 单词查询和释义显示
- ✅ 查询历史记录管理
- ✅ 智能缓存机制
- ✅ 网络错误处理
- ✅ 配置管理和验证
- ✅ 多服务提供商支持
- ✅ TypeScript类型安全

## 支持的服务提供商

### 1. 有道词典 (Youdao Dictionary)
- 需要API Key和Secret
- 提供完整的单词释义、音标、例句
- 支持发音URL
- 需要网络连接

### 2. 模拟服务 (Mock Service)
- 无需配置
- 提供预定义的单词数据
- 适用于开发和测试
- 离线可用

## 快速开始

### 1. 配置词典服务

```typescript
import { DictionaryConfigManager } from '@/services/dictionary';

// 配置有道词典
const youdaoConfig = {
  provider: 'youdao' as const,
  appKey: 'your-app-key',
  appSecret: 'your-app-secret',
  enabled: true,
};

DictionaryConfigManager.saveConfig(youdaoConfig);

// 或配置模拟服务
const mockConfig = {
  provider: 'mock' as const,
  appKey: '',
  appSecret: '',
  enabled: true,
};

DictionaryConfigManager.saveConfig(mockConfig);
```

### 2. 创建服务实例

```typescript
import { DictionaryServiceFactory } from '@/services/dictionary';

// 从配置创建服务
const service = await DictionaryServiceFactory.createService();

// 或直接传入配置
const service = await DictionaryServiceFactory.createService(config);
```

### 3. 查询单词

```typescript
// 查询单词释义
const definition = await service.lookupWord('hello');
console.log(definition);
// {
//   word: 'hello',
//   phonetic: '/həˈloʊ/',
//   pronunciation: 'http://example.com/hello.mp3',
//   definitions: [
//     { partOfSpeech: 'int.', meaning: '你好；喂' },
//     { partOfSpeech: 'n.', meaning: '表示问候的用语' }
//   ],
//   examples: ['Hello, how are you?']
// }

// 获取发音URL
const pronunciationUrl = await service.getWordPronunciation('hello');

// 搜索单词
const results = await service.searchWords('hel', 5);
```

## 使用React Hook

```typescript
import { useDictionary } from '@/hooks/useDictionary';

function MyComponent() {
  const {
    lookupWord,
    queryState,
    isConfigured,
    updateConfig,
  } = useDictionary();

  const handleSearch = async (word: string) => {
    try {
      const result = await lookupWord(word);
      console.log('查询结果:', result);
    } catch (error) {
      console.error('查询失败:', error);
    }
  };

  if (!isConfigured) {
    return <div>请先配置词典服务</div>;
  }

  return (
    <div>
      <button onClick={() => handleSearch('hello')}>
        查询单词
      </button>
      {queryState.status === 'loading' && <div>查询中...</div>}
      {queryState.status === 'error' && (
        <div>错误: {queryState.error?.message}</div>
      )}
      {queryState.data && (
        <div>
          <h3>{queryState.data.word}</h3>
          <p>{queryState.data.phonetic}</p>
          {queryState.data.definitions.map((def, index) => (
            <div key={index}>
              <strong>{def.partOfSpeech}</strong> {def.meaning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 配置管理

### 验证配置

```typescript
import { DictionaryConfigManager } from '@/services/dictionary';

const validation = DictionaryConfigManager.validateConfig(config);
if (!validation.isValid) {
  console.error('配置错误:', validation.errors);
}
```

### 检查配置状态

```typescript
const isConfigured = DictionaryConfigManager.isConfigured();
const config = DictionaryConfigManager.getConfig();
```

### 更新配置

```typescript
const updatedConfig = DictionaryConfigManager.updateConfig({
  enabled: false,
});
```

## 错误处理

词典服务使用统一的错误处理机制：

```typescript
import { AppError, ErrorType } from '@/types';

try {
  const result = await service.lookupWord('test');
} catch (error) {
  if (error instanceof AppError) {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        console.log('网络错误，请检查网络连接');
        break;
      case ErrorType.API_ERROR:
        console.log('API错误:', error.message);
        break;
      case ErrorType.VALIDATION_ERROR:
        console.log('输入验证错误:', error.message);
        break;
      default:
        console.log('未知错误:', error.message);
    }
  }
}
```

## 缓存机制

词典服务内置了智能缓存机制：

- **缓存时间**: 24小时
- **最大缓存数**: 1000条记录
- **缓存策略**: LRU (最近最少使用)
- **自动清理**: 过期自动删除

```typescript
// 清除缓存
service.clearCache();

// 清除查询历史
service.clearHistory();

// 获取查询历史
const history = service.getQueryHistory(50);
```

## 有道词典API配置

1. 注册有道智云账号: https://ai.youdao.com/
2. 创建应用获取API Key和Secret
3. 配置服务:

```typescript
const config = {
  provider: 'youdao' as const,
  appKey: 'your-app-key',      // 应用ID
  appSecret: 'your-app-secret', // 应用密钥
  enabled: true,
};
```

## 测试

运行词典服务测试：

```bash
# 运行所有词典测试
yarn test src/services/dictionary/

# 运行单元测试
yarn test src/services/dictionary/__tests__/DictionaryService.test.ts

# 运行集成测试
yarn test src/services/dictionary/__tests__/DictionaryIntegration.test.ts
```

## 演示页面

访问 `/dictionary-demo` 路由查看词典服务的完整演示，包括：

- 服务配置界面
- 单词查询功能
- 错误处理演示
- 查询状态显示

## API参考

### DictionaryService接口

```typescript
interface DictionaryService {
  lookupWord(word: string): Promise<WordDefinition>;
  getWordPronunciation(word: string): Promise<string>;
  searchWords(query: string, limit?: number): Promise<WordDefinition[]>;
}
```

### WordDefinition接口

```typescript
interface WordDefinition {
  word: string;
  phonetic?: string;
  pronunciation?: string;
  definitions: Definition[];
  examples?: string[];
}

interface Definition {
  partOfSpeech: string;
  meaning: string;
  example?: string;
}
```

### DictionaryConfig接口

```typescript
interface DictionaryConfig {
  id: number;
  provider: 'youdao' | 'mock';
  appKey: string;
  appSecret: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 注意事项

1. **API限制**: 有道词典API有调用频率限制，请合理使用
2. **网络依赖**: 有道词典需要网络连接，建议提供离线降级方案
3. **缓存管理**: 定期清理缓存避免占用过多存储空间
4. **错误处理**: 始终处理可能的网络和API错误
5. **配置安全**: 不要在客户端暴露API密钥，考虑使用代理服务

## 许可证

本项目采用 MIT 许可证。