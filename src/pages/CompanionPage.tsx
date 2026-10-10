import { Link } from 'react-router-dom';
import SectionPageHeader from '../components/SectionPageHeader';
import CompanionPet from '../components/companion/CompanionPet';
import { useCompanionStore } from '../store/companionStore';
import { companionApiUrl } from '../companion/client';

export default function CompanionPage() {
  return <div className="site-page companion-intro-page">
    <SectionPageHeader title="构造伙伴" eyebrow="LEARNING COMPANION / 随页学习" description="从一个构件开始，把模型、图纸与构造知识联系起来。" />
    <main className="companion-intro-layout"><section className="companion-intro-copy"><span>你的建筑构造学习伙伴</span><h2>看到哪里，<br/>就从哪里提问。</h2><p>选择模型构件，查阅它的作用和材料；阅读课程，找到关联节点；遇到训练难题，获得下一步观察提示。</p><button onClick={() => useCompanionStore.getState().setOpen(true)}>打开构造伙伴 <span aria-hidden="true">↗</span></button><small>{companionApiUrl ? '已配置 AI 接口，回答附站内资料来源。' : '当前使用站内资料与课程提示，尚未接入生成式 AI。'}</small><Link to="/library">先去构造节点看看 →</Link></section><div className="companion-intro-visual"><div className="companion-intro-pet"><CompanionPet/></div><span>构造伙伴</span><p>梁 · 层 · 节点</p></div></main>
    <section className="companion-intro-features"><article><span>01 / 观察</span><h3>解释选中构件</h3><p>根据当前节点卡片查找知识，保留图纸未标注信息。</p></article><article><span>02 / 联系</span><h3>找到资料来源</h3><p>回答可打开对应节点、章节或建筑案例继续阅读。</p></article><article><span>03 / 练习</span><h3>一步一步提示</h3><p>训练前引导观察，提交后解释知识；本题帮助记为提示。</p></article></section>
  </div>;
}
