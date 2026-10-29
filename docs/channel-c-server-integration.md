# H5 C 服务端接口对接与待补清单

以 2026-10-28 提供的《H5 版本 C 前端接口变更清单》为准。CMS 仓库为 `/Users/wangjie/web/project/h5-cms-v3`，H5 为当前仓库。网关 `/api` 前缀、登录与鉴权沿用原配置，没有新增首页列表接口。

## 已对齐

- CMS 牌桌模板仍提交完整房间配置，新增的 `is_top`、`room_intro`、`room_features` 提升到 body 顶层；创建默认热门为数字 1，编辑保留 0 和空字符串。
- CMS MTT 通过 `config` 保存数字 `is_top` 及独立的 A/B、C 图片，创建 id=0、编辑保留原 id，模板详情保持原响应层级；不依赖已建赛事列表中尚未提供的 `is_top`。
- CMS 平台账户可以设置 `h5_menu=3`，H5 菜单和路由完全依赖服务端枚举，不再随机选择 C。
- CMS Banner 在同一条配置内保存 A/B 与 C 图，展示场景只区分 H5 和 Telegram。C 图列表列、上传和提交仅限俱乐部角色，尺寸提示 372*69；非俱乐部角色省略 C 字段以保留服务端原值。使用列表项编辑回显，省略保留、显式空字符串清空，不用 A/B 覆盖 C。
- 修正已有 Banner 聚合适配器的路由为 `/misc/banner_lobby`；A/B/C 大厅列表请求共用 H5（1）或 Telegram（2）场景，按 `image_url` / `image_url_c` 选择图片。C 图无配置或加载失败时仍复用原有默认图。
- CMS 对局、邀新直接读写配置数组，字段分别为 `sb/hand_count/reward_gold/rewards`、`invite_count/reward_gold/rewards`，不添加 tribe_id、tier_id 或 list 包装；支持 [] 清空。补齐 100 档、门票数量 1–1000、同档门票去重校验；配置加载失败禁止保存。
- H5 推荐仅接受 `is_top === 1`，不将 `is_hot` 自动转换。HTTP 完整记录、房间缓存对比、MTT 完整/变化记录和 WebSocket 合并均保留 0/空字符串，不丢失取消推荐或清空文案、C 图的更新。
- 普通邀请链接带现有玩家随机 ID（user/info 中的 `un_id`）和目标俱乐部 `invite_code`。注册携带 `inviter_random_id`；会缓存到同一目标俱乐部的注册流程中，成功后清除，避免与代理邀请混用。`register` 与 `invite_register` 分别声明响应类型，后者仅返回手机号/邮箱字符串。
- 扩展服务房间请求的新字段在顶层，MTT 仍在 `template`；补全模板及详情响应类型，不展开或改变 `data.data` 等既有层级。

## 奖励查询与通知（2026-10-29）

服务端已提供统一客户端查询 `POST /api/prop/tribe/reward/info` 和 `155 MSG_S_TRIBE_ACTIVITY_REWARD`。此前列出的客户端配置、玩家进度和活动到账通知均已有正式定义，现已接入，三个弹窗不再使用展示数据兜底。

请求使用必填的 `club_id` 和 `reward_type=all`。响应 `data.hand_reward / invite_reward` 保留 `current_count/completed/earned/rewarded/delivered`；只按 rewarded 显示到账，达标或已建单但未发放显示待发奖。充值两类仅展示返回配置，不计算玩家累计进度。道具名称使用 prop_name 多语言 ID，rewards=null 按空列表处理。

充值区间 `start_amount/end_amount` 已确认为 UC，与 CMS 直接保存的单位一致；H5 新奖励查询和原钱包归一化均不再除以 100。小盲和门票价值仍按分单位转换。

155 按 order_no 去重展示 UC/门票，并刷新同俱乐部或联盟中已打开的活动页。保留 reward_kind/tier 原始值，不猜测数字枚举；绑定俱乐部、统计与发奖均由服务端负责。详见 [奖励接入说明](channel-c-rewards.md)。

## 协议同步（2026-10-29）

`agreement-web` 已拉取远程更新，并切换到客户端使用的 `master`。H5 与 Cocos 的依赖锁定和实际安装均从 `921be24` 更新到 `72cacc6a4c2c584ba797ed11e41dd971c6cf6303`；使用仓库发布的生成产物，没有手工指定 protobuf 字段编号。Cocos 本地构建模板、预览模板和已有 web-mobile 构建中的协议运行时也已同步，并校验与安装包内容一致。

协议已包含 `RoomRecord`、`RoomChange` 的 `is_top/room_intro/room_features`，`UserMttRecord` 的 `mtt_banner_url_c`，以及 `UserMttRecordChange` 的 `is_top/mtt_banner_url_c`。使用实际安装的协议运行时构造二进制通知，再通过 H5 解码器验证字段、0/空字符串默认值、A/B 与 C 图片分离、历史 `is_hot` 不转换为推荐。测试文件为 `tests/channelCProtocol.test.ts`。

此前针对旧协议的可选 getter 兼容逻辑继续保留。155 活动通知使用正式生成类解码并完成本地二进制回归测试；服务端真实账号的玩家进度、通知与发奖仍需端到端联调。协议脚本通过内容版本区分缓存，防止页面继续加载旧运行时。

`@holdem-pb` 的类型别名通过 `src/types/holdem-pb.d.ts` 转发正式包的 exports.types，不直接绑定 pnpm 软链接下的生成文件。`pnpm check:protocol` 同时检查 155 的声明、运行时和解码类，开发启动、构建前置及同步协议脚本都会执行检查，依赖过期会明确报错。

## 验证范围

接口契约测试验证实际 CMS 请求体、数字开关、字段清空、独立图片和直接数组；H5 测试验证字段合并、场景选择、推荐规则和邀请参数。构建和静态检查不能替代使用真实账号进行保存、发奖与长连接端到端联调。
