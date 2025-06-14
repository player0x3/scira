# 概述

API 端点 (`app/api/search/route.ts`) 作为 AI 驱动的搜索和任务执行的主要接口。它具有双重功能：处理基于工具的直接响应和启动“极限”深度研究任务。

# 技术栈

本项目采用以下主要框架、服务和库：

*   **前端框架**: Next.js
*   **AI SDK**: Vercel AI SDK
*   **LLM 提供商**:
    *   OpenAI
    *   Scira (封装 Grok, Anthropic, XAI 等)
*   **搜索服务**:
    *   Tavily
    *   Exa
*   **代码执行**: Daytona
*   **关键数据 API**:
    *   TMDB (电影数据库)
    *   OpenWeather (天气信息)
    *   Google Maps (地图服务)
    *   AviationStack (航空数据)
    *   Smithery (Minecraft 服务器信息)
    *   yfinance (通过 Daytona 获取金融数据)
*   **数据库**: SQL (使用 Prisma ORM)
*   **缓存/流处理**: Redis
*   **核心语言**: TypeScript
*   **模式验证**: Zod

# Agent 功能实现方式

Agent 的核心功能通过以下机制实现：

1.  **请求生命周期**:
    *   **请求处理**: API 端点 (`app/api/search/route.ts`) 接收用户请求。
    *   **模型选择**: 根据请求类型（例如，是否需要“极限”研究）和用户偏好选择合适的 LLM 模型。
    *   **系统提示**: 构建系统提示，其中包含当前对话上下文、用户指令以及可用工具的描述和参数模式 (Schema)，供 LLM 理解和使用。

2.  **工具定义**:
    *   每个工具都包含：
        *   **描述 (Description)**: 清晰说明工具的功能，供 LLM 理解。
        *   **Zod 参数 (Zod Parameters)**: 使用 Zod 定义工具调用所需的参数模式，确保类型安全和数据验证。
        *   **执行函数 (Execute Function)**: 实际执行工具逻辑的 TypeScript 函数。

3.  **LLM 在工具调用中的作用**:
    *   **决定是否使用工具**: LLM 分析用户请求和系统提示，判断是否需要以及哪个工具最适合当前任务。
    *   **生成参数**: 如果决定使用工具，LLM 会根据工具的 Zod 模式生成调用该工具所需的参数。

4.  **后端工具执行**:
    *   **调用外部 API**: 工具的执行函数通常会调用外部服务 API (例如 Tavily, Google Maps, TMDB 等) 或内部服务 (例如 Daytona 代码执行)。
    *   **数据处理**: 执行函数处理从外部 API 获取的数据，将其转换为 LLM 更易于理解和使用的格式。

5.  **LLM 使用工具输出**:
    *   工具执行的结果 (成功或错误信息以及数据) 返回给 LLM。
    *   LLM 利用这些输出信息来形成最终的用户答案或进行下一步的思考和工具调用。

6.  **UI 更新的流式处理**:
    *   为了提供流畅的用户体验，系统采用流式处理方式。
    *   **文本流**: LLM 生成的文本内容会实时流式传输到前端 UI。
    *   **注解流 (Annotations)**: 工具调用、执行状态和结果等关键事件会作为注解 (annotations) 伴随文本流一起发送，使得 UI 能够展示丰富的过程信息。

7.  **`experimental_repairToolCall` 机制**:
    *   这是一个实验性功能，旨在提高工具调用的鲁棒性。
    *   如果 LLM 生成的工具参数未能通过 Zod 验证，系统会尝试使用 `experimental_repairToolCall`。
    *   此机制会向 LLM 提供原始参数、Zod 错误信息以及 Zod 模式本身，请求 LLM 修正参数并重新尝试工具调用。这有助于自动纠正 LLM 可能产生的格式错误或无效参数。

# 普通搜索与极限搜索

系统提供两种主要的搜索和任务执行模式：

## 1. 普通搜索 (Normal Search)

*   **原理**:
    *   由主 LLM (例如 OpenAI, Scira 等) 直接处理用户请求。
    *   LLM 可以直接调用在 `app/api/search/route.ts` 中定义的任何可用工具来获取信息或执行操作。
    *   适用于相对直接的问题，可以通过一次或几次工具调用来解决。
*   **实现**:
    *   主要逻辑位于 `app/api/search/route.ts` 中的 `POST` 请求处理函数。
    *   使用 Vercel AI SDK 的 `streamText` 方法，该方法支持工具调用和流式响应。
*   **工具访问**:
    *   可以访问所有已注册的工具，包括搜索 (Tavily)、数据查询 (TMDB, OpenWeather 等)、代码执行 (Daytona) 等。

## 2. 极限搜索 (Extreme Search)

*   **原理**:
    *   专为复杂研究任务设计，当用户启用“极限”模式时激活。
    *   采用一个自主的、多步骤的研究代理 (位于 `ai/extreme-search.ts`)。
    *   该代理首先进行规划 (planning)，然后迭代执行研究步骤，直到收集到足够的信息来回答用户的原始问题。
*   **实现**:
    *   **调用方式**: 从主 API 路由 (`app/api/search/route.ts`) 中，极限搜索本身被当作一个名为 `extreme_search` 的工具来调用。
    *   **内部运作**:
        *   `ai/extreme-search.ts` 中的 `extremeSearch` 函数是其核心。
        *   使用 Vercel AI SDK 的 `generateObject` 功能，让 LLM 根据用户查询生成研究计划 (包括研究步骤和要回答的问题列表)。
        *   对于每个研究步骤，使用 Vercel AI SDK 的 `generateText` 功能来执行该步骤，通常涉及调用其内部可用的工具。
        *   研究进度和部分结果会通过流式回调 (`onProgress`) 实时更新到 UI。
*   **工具访问**:
    *   **主要工具**: 目前主要依赖 `exa_search` (Exa API) 进行深度网络搜索和内容提取。
    *   **其他工具**: 代码中包含对 `codeRunner` (Daytona) 工具的引用 (已注释掉)，表明未来可能扩展其内部工具集以支持更复杂的研究任务，例如数据分析或代码执行。

这种双模式设计使得系统既能快速响应简单查询，又能深入处理复杂的研究型问题。

# 工具概述

`app/api/search/route.ts` 中定义了多种工具，供 LLM 在普通搜索模式下直接调用，或供极限搜索代理内部使用。以下是一些关键工具及其用途：

*   **`web_search`**:
    *   **用途**: 通用网络搜索。
    *   **服务**: Tavily API。
*   **`extreme_search`**:
    *   **用途**: 启动极限研究模式，处理复杂查询。
    *   **实现**: 代理逻辑位于 `ai/extreme-search.ts`，内部主要使用 Exa API 进行多步骤搜索和内容提取。
*   **`stock_chart`**:
    *   **用途**: 获取股票价格数据并生成图表，同时获取相关新闻。
    *   **服务**: Daytona (通过 yfinance 获取股价)，Tavily/Exa (获取新闻)。
*   **`currency_converter`**:
    *   **用途**: 货币汇率转换。
    *   **服务**: Daytona (通过 yfinance 获取汇率数据)。
*   **`code_interpreter`**:
    *   **用途**: 执行 Python 代码片段，用于数据分析、计算等。
    *   **服务**: Daytona。
*   **`retrieve`**:
    *   **用途**: 从特定 URL 列表或文档 ID 中检索和提取内容。
    *   **服务**: Exa API。
*   **`academic_search`**:
    *   **用途**: 搜索学术论文和出版物。
    *   **服务**: Exa API。
*   **`youtube_search`**:
    *   **用途**: 搜索 YouTube 视频。
    *   **服务**: Exa API。
*   **`x_search`**:
    *   **用途**: 在 X (前 Twitter) 平台上进行搜索。
    *   **服务**: xAI API (Grok)。
*   **`movie_or_tv_search`**:
    *   **用途**: 搜索电影或电视剧的详细信息。
    *   **服务**: TMDB API。
*   **`trending_movies`**:
    *   **用途**: 获取当前热门电影列表。
    *   **服务**: TMDB API。
*   **`trending_tv`**:
    *   **用途**: 获取当前热门电视剧列表。
    *   **服务**: TMDB API。
*   **`get_weather_data`**:
    *   **用途**: 获取指定地点的当前天气和预报。
    *   **服务**: OpenWeather API / Open-Meteo API。
*   **`find_place_on_map`**:
    *   **用途**: 在地图上查找并显示特定地点。
    *   **服务**: Google Maps API。
*   **`nearby_places_search`**:
    *   **用途**: 搜索指定位置附近的兴趣点 (例如餐馆、商店)。
    *   **服务**: Google Maps API。
*   **`text_translate`**:
    *   **用途**: 将文本翻译成指定语言。
    *   **服务**: (具体实现未在代码中明确指定，通常可利用通用翻译服务 API 或 LLM 自身的翻译能力)。
*   **`track_flight`**:
    *   **用途**: 追踪航班状态。
    *   **服务**: AviationStack API。
*   **`datetime`**:
    *   **用途**: 获取当前日期和时间。
    *   **服务**: (通过本地系统函数获取)。
*   **`mcp_search`**:
    *   **用途**: 搜索 Minecraft 服务器信息。
    *   **服务**: Smithery API。
*   **`reddit_search`**:
    *   **用途**: 在 Reddit 上搜索帖子和评论。
    *   **服务**: Tavily API (利用其 Reddit 搜索功能)。

这些工具共同为 Agent 提供了强大的信息获取和任务执行能力。

# 工具协同工作方式

在系统中，工具并非孤立存在，而是通过 LLM 的智能编排协同工作，以完成用户请求。

*   **LLM 作为主要协调者**:
    *   LLM 是整个工具调用流程的核心。它分析用户意图，并根据可用工具的描述和参数模式，决定何时以及如何使用一个或多个工具。

*   **基于 LLM 推理的顺序工具使用**:
    *   对于复杂的请求，LLM 可能会进行一系列的思考和工具调用。
    *   例如，用户询问“查找关于 X 公司的最新新闻，并分析其最近的股价表现”。LLM 可能会：
        1.  首先调用 `web_search` (Tavily) 或 `x_search` (Grok) 工具查找最新新闻。
        2.  然后，根据新闻内容，调用 `stock_chart` 工具获取股价图表和相关财务数据。
        3.  最后，综合所有信息，形成对用户问题的回答。

*   **`extreme_search` 作为元工具 (Meta-tool)**:
    *   `extreme_search` 工具本身就是一个复杂工具调用的协调者。
    *   当被主 LLM 调用时，它会启动一个内部的 LLM 代理 (位于 `ai/extreme-search.ts`)。
    *   这个内部代理会制定自己的研究计划，并顺序调用其可访问的工具 (主要是 Exa 搜索) 来逐步收集和整合信息，直到能够全面回答用户的原始复杂查询。

*   **上下文中的工具输出影响后续决策**:
    *   每次工具执行后，其输出 (无论是数据、文本摘要还是错误信息) 都会被添加回 LLM 的上下文 (对话历史) 中。
    *   这些新的信息会影响 LLM 的后续决策。例如：
        *   如果一个工具调用失败或返回不满意的数据，LLM 可能会尝试使用不同的参数再次调用该工具，或者选择一个替代工具。
        *   一个工具的输出可能包含需要进一步探究的实体或概念，促使 LLM 进行后续的工具调用以获取更多细节。

通过这种方式，LLM 能够动态地、有逻辑地组合和利用各种工具，以最高效的方式满足用户的多样化需求，无论是简单的信息查询还是复杂的多步骤研究任务。
