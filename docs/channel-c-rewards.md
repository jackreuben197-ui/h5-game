# 渠道 C 奖励弹窗

三个弹窗沿用 Game Design 的 `11799:1337`、`11799:1439`、`11799:1512`、`11799:1586`。

## 客户端查询

统一请求 `POST /api/prop/tribe/reward/info`，body 为 `{ "club_id": 目标俱乐部ID, "reward_type": "all" }`。现有 HTTP 客户端处理 `/api` 前缀和鉴权。点击奖励入口先经过真实账号校验；游戏客户端不调用 CMS 管理接口。

接口 `data` 内读取 `hand_reward`、`invite_reward`、`first_recharge_reward`、`daily_recharge_reward`、`tribe_id` 和 `hand_reward_club_id`，不额外展开一层 data。四类配置共享一次请求，充值页切换首充/日常不重复查询。`rewards=null` 或缺失配置按空列表展示，失败显示重试状态，无展示数据兜底。

`useTribeRewardStore` 按账号和目标俱乐部隔离数据。俱乐部/账号切换会清空上一份个人进度，迟到的旧响应不能覆盖新数据；通知到达时若查询进行中，合并为一次后续刷新。

## 展示规则与单位

- 对局按真实 `sb` 和 `hand_count` 分组，显示 `current_count`；`sb=100` 显示 `1/2`。保留服务端配置的级别及零币、空门票的条件档位。
- 邀新保留全部档位及各自的 `current_count`，顶部展示返回档位中的有效邀请人数。没有配置时显示空状态。
- `rewarded` 为真才显示已到账；`completed` 或 `earned` 为真但未发放时显示待发奖。`delivered` 表示通知发送，不用于推断到账。手数、邀请 IP 去重、绑定俱乐部和发奖均由服务端统计，前端不自增进度。
- `reward_gold` 和充值 `start_amount/end_amount` 都是 UC，不除以 100（2026-10-29 确认，与 CMS 一致）；`sb`、门票 `prop_value` 按分单位除以 100，且只在展示归一化时转换一次。原钱包奖励接口遵循相同规则。
- `prop_name` 为服务端多语言 ID，使用现有公共模板缓存和 i18n 解析。旧奖励数据的 `multi_language` 兼容保留。加载、失败、重试、待发奖等文案复用现有多语言 key。
- 充值弹窗读取新接口的配置，不把它展示为玩家充值累计进度；钱包价格/支付渠道继续使用原价格接口。

## 活动到账通知

共享协议已更新到 `72cacc6a4c2c584ba797ed11e41dd971c6cf6303`。订阅 `155 / Code.MSG_S_TRIBE_ACTIVITY_REWARD`，使用正式 `ServerMessageTribeActivityReward` 解码：`order_no`、`tribe_id`、`club_id`、`reward_kind`、`tier`、`reward_gold`、`reward_props`。

保留 `reward_kind/tier` 元数据，到账弹窗统一展示币和门票，不猜测数字枚举含义。按 `order_no` 去重；与旧 133 同单时，155 的完整奖励内容补全正在展示或排队的通知。旧订单成功消息仍负责关闭支付弹窗。活动通知刷新同俱乐部或同联盟中已打开的奖励弹窗；不在客户端执行发奖或累加钱包余额。

H5 可见时展示到账，牌局中收到的活动奖励在回到大厅后展示；旧充值通知保持原有牌局中不补弹的行为。登出或切换账号清理待展示队列。协议脚本 URL 带内容版本，避免业务升级后浏览器继续使用旧 protobuf 缓存。

## 验证

`tests/tribeRewardApi.test.ts` 检查接口路径与响应层级，`tests/tribeRewardStore.test.ts` 检查请求合并、身份隔离、重试和通知刷新，`tests/tribeReward.test.ts` 检查状态语义、金额单位与去重队列，`tests/channelCProtocol.test.ts` 使用实际安装的协议运行时序列化并解码通知。另保留原充值、排序与卡片回归测试。真实账号的服务端发奖仍需端到端联调。
