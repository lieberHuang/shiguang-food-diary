'use client';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { fatEnergyShare } from '@/lib/nutrition';
import {
  Leaf,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Camera,
  Plus,
  Sparkles,
  Sun,
  Sunrise,
  Moon,
  Cookie,
  Utensils,
  ImagePlus,
  Check,
  Trash2,
  LoaderCircle,
  X,
  ScanLine,
  Info,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Toaster, toast } from '@/components/ui/toast';

type Meal = '早餐' | '午餐' | '晚餐' | '加餐';
type Food = {
  id: string;
  name: string;
  grams: number;
  p: number;
  c: number;
  f: number;
  meal: Meal;
  date: string;
  photo?: string;
  time: string;
  sample?: boolean;
};
const meals: Meal[] = ['早餐', '午餐', '晚餐', '加餐'];
const mealIcons = [Sunrise, Sun, Moon, Cookie];
const mealTimes = [
  '开启元气的一天',
  '好好吃饭，慢慢生活',
  '用一餐美味结束忙碌',
  '给自己一点小满足',
];
const staticBase = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const images = {
  breakfast: `${staticBase}/images/breakfast.jpg`,
  lunch: `${staticBase}/images/lunch.jpg`,
  snack: `${staticBase}/images/snack.jpg`,
};
const key = 'shiguang-diary-v1';
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const round = (v: number) => Math.round(v * 10) / 10;
const kcal = (f: { p: number; c: number; f: number }) =>
  Math.round(f.p * 4 + f.c * 4 + f.f * 9);
const addDays = (date: string, n: number) => {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return dayKey(d);
};
const total = (foods: Food[]) =>
  foods.reduce((a, b) => ({ p: a.p + b.p, c: a.c + b.c, f: a.f + b.f }), {
    p: 0,
    c: 0,
    f: 0,
  });
const sampleFoods = (date: string): Food[] => [
  {
    id: 'sample-breakfast',
    name: '牛油果鸡蛋全麦吐司',
    grams: 210,
    p: 18.4,
    c: 35.2,
    f: 17.8,
    meal: '早餐',
    date,
    photo: images.breakfast,
    time: '08:30',
    sample: true,
  },
  {
    id: 'sample-lunch',
    name: '香煎鸡胸肉蔬菜沙拉',
    grams: 350,
    p: 38.6,
    c: 42.5,
    f: 16.2,
    meal: '午餐',
    date,
    photo: images.lunch,
    time: '12:15',
    sample: true,
  },
  {
    id: 'sample-snack',
    name: '蓝莓燕麦酸奶碗',
    grams: 180,
    p: 9.8,
    c: 24.6,
    f: 5.4,
    meal: '加餐',
    date,
    photo: images.snack,
    time: '15:30',
    sample: true,
  },
];
const fresh = (meal: Meal, date: string): Food => ({
  id: '',
  name: '',
  grams: 100,
  p: 0,
  c: 0,
  f: 0,
  meal,
  date,
  time: new Date().toTimeString().slice(0, 5),
});

export default function Home() {
  const [today, setToday] = useState('2026-09-05');
  const [date, setDate] = useState('2026-09-05');
  const [foods, setFoods] = useState<Food[]>([]);
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [draft, setDraft] = useState<Food>(fresh('午餐', '2026-09-05'));
  const [endpoint, setEndpoint] = useState('');
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const taskId = useRef(0);
  useEffect(() => {
    const now = dayKey(new Date());
    setToday(now);
    setDate(now);
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved);
        if (!Array.isArray(data.foods)) throw Error();
        setFoods(
          data.foods.filter(
            (f: Food) =>
              f &&
              typeof f.id === 'string' &&
              meals.includes(f.meal) &&
              ['p', 'c', 'f', 'grams'].every(
                (k) =>
                  Number.isFinite(f[k as keyof Food]) &&
                  Number(f[k as keyof Food]) >= 0,
              ),
          ),
        );
      } else setFoods(sampleFoods(now));
    } catch {
      setFoods(sampleFoods(now));
      toast.add({ title: '本地记录无法读取，已载入示例。', type: 'error' });
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(key, JSON.stringify({ foods }));
      } catch {
        toast.add({
          title: '浏览器存储空间不足，当前修改尚未保存。',
          type: 'error',
        });
      }
  }, [foods, ready]);
  useEffect(() => {
    fetch(`${staticBase}/config.json`)
      .then((r) => r.json())
      .then((c) =>
        setEndpoint(
          c &&
            typeof c === 'object' &&
            'analysisEndpoint' in c &&
            typeof c.analysisEndpoint === 'string'
            ? c.analysisEndpoint
            : '',
        ),
      )
      .catch(() => {});
  }, []);
  const daily = foods.filter((f) => f.date === date),
    sums = total(daily),
    energy = kcal(sums);
  const fatEnergy = fatEnergyShare(sums);
  const current = new Date(date + 'T12:00:00');
  const monday = addDays(date, -((current.getDay() + 6) % 7));

  const liveState = useRef({ foods, date });
  liveState.current = { foods, date };
  useEffect(() => {
    type Tool = {
      name: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    };
    const ctx = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Tool,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!ctx?.registerTool) return;
    const lifecycle = new AbortController();
    const definitions: Tool[] = [
      {
        name: 'get_daily_nutrition',
        description: '读取当前所选日期的食物记录与三大营养素汇总。',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: () => {
          const state = liveState.current;
          const entries = state.foods.filter((f) => f.date === state.date);
          const sums = total(entries);
          return {
            date: state.date,
            foods: entries.map(({ photo, ...rest }) => rest),
            totals: sums,
            kcal: kcal(sums),
            fatEnergy: fatEnergyShare(sums),
          };
        },
      },
      {
        name: 'start_photo_record',
        description: '打开拍照或相册选择流程并选择餐次，尚未识别或保存记录。',
        inputSchema: {
          type: 'object',
          properties: { meal: { type: 'string', enum: meals } },
          required: ['meal'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input) => {
          const meal = (input as { meal?: Meal })?.meal;
          if (!meal || !meals.includes(meal))
            throw Error('meal 必须是早餐、午餐、晚餐或加餐');
          flushSync(() => {
            taskId.current++;
            setBusy(false);
            setDraft(fresh(meal, liveState.current.date));
            setPhoto('');
            setFile(null);
            setError('');
            setModal('add');
          });
          return {
            status: 'photo_flow_opened',
            meal,
            date: liveState.current.date,
          };
        },
      },
    ];
    for (const tool of definitions) {
      try {
        Promise.resolve(
          ctx.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    }
    return () => lifecycle.abort();
  }, []);
  const start = (meal: Meal = '午餐') => {
    taskId.current++;
    setBusy(false);
    setDraft(fresh(meal, date));
    setPhoto('');
    setFile(null);
    setError('');
    setModal('add');
  };
  const close = () => {
    taskId.current++;
    setBusy(false);
    setModal(null);
  };
  async function pick(f?: File) {
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      setError('请选择 JPG、PNG 或 WebP 图片。');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('图片需小于 10 MB，请压缩后重试。');
      return;
    }
    setError('');
    setFile(f);
    const id = ++taskId.current;
    try {
      const uri = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(f);
      });
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = uri;
      });
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 640 / img.width, 640 / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas
        .getContext('2d')!
        .drawImage(img, 0, 0, canvas.width, canvas.height);
      if (id === taskId.current) setPhoto(canvas.toDataURL('image/jpeg', 0.75));
    } catch {
      setError('这张图片无法读取，请换一张试试。');
    }
  }
  async function analyze() {
    const id = ++taskId.current;
    setBusy(true);
    setError('');
    try {
      const config = { analysisEndpoint: endpoint };
      let result: Partial<Food>;
      if (config.analysisEndpoint) {
        if (!file) throw Error('请先选择一张食物照片。');
        const fd = new FormData();
        fd.append('image', file);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        let response;
        try {
          response = await fetch(config.analysisEndpoint, {
            method: 'POST',
            body: fd,
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }
        if (!response.ok) throw Error('识别服务暂时不可用，请稍后重试。');
        result = await response.json();
        if (
          typeof result.name !== 'string' ||
          !result.name.trim() ||
          !['grams', 'p', 'c', 'f'].every(
            (k) =>
              typeof result[k as keyof Food] === 'number' &&
              Number.isFinite(result[k as keyof Food]) &&
              Number(result[k as keyof Food]) >= 0,
          ) ||
          Number(result.grams) <= 0
        )
          throw Error('解析结果格式不正确，请重新识别或更换照片。');
        result = {
          name: result.name,
          grams: result.grams,
          p: result.p,
          c: result.c,
          f: result.f,
          sample: false,
        };
      } else {
        await new Promise((r) => setTimeout(r, 1100));
        result = {
          name: '香煎鸡胸肉蔬菜沙拉',
          grams: 350,
          p: 38.6,
          c: 42.5,
          f: 16.2,
          sample: true,
        };
      }
      if (id !== taskId.current) return;
      setDraft((d) => ({ ...d, ...result, photo: photo || images.lunch }));
      setModal('edit');
    } catch (e) {
      if (id === taskId.current)
        setError(e instanceof Error ? e.message : '解析失败，请重试。');
    } finally {
      if (id === taskId.current) setBusy(false);
    }
  }
  function save() {
    if (
      !draft.name.trim() ||
      !Number.isFinite(draft.grams) ||
      draft.grams <= 0 ||
      draft.grams > 10000 ||
      ![draft.p, draft.c, draft.f].every(
        (n) => Number.isFinite(n) && n >= 0 && n <= 10000,
      )
    ) {
      setError('请填写食物名称、有效份量和非负营养数值。');
      return;
    }
    if (draft.p + draft.c + draft.f > draft.grams + 1) {
      setError('三大营养素的总重量不能大于食物份量，请检查数值。');
      return;
    }
    const entry = {
      ...draft,
      name: draft.name.trim(),
      id: draft.id || crypto.randomUUID(),
    };
    setFoods((all) =>
      draft.id
        ? all.map((f) => (f.id === draft.id ? entry : f))
        : [...all, entry],
    );
    close();
    toast.add({
      title: '已保存到' + entry.meal + '，每日摄入已更新',
      type: 'success',
    });
  }
  function changeGrams(v: number) {
    setDraft((d) => {
      const ratio = d.grams > 0 ? v / d.grams : 1;
      return {
        ...d,
        grams: v,
        p: round(d.p * ratio),
        c: round(d.c * ratio),
        f: round(d.f * ratio),
      };
    });
  }
  return (
    <>
      <Toaster />
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href={staticBase || '/'} aria-label="食光首页">
            <span className="brand-icon">
              <Leaf size={23} />
            </span>
            <strong>
              食光<span>SHIGUANG</span>
            </strong>
          </a>
          <h1 className="app-title">饮食日记</h1>
        </div>
      </header>
      <main className="workspace">
        <div className="datebar">
          <div className="date-title">
            <button
              className="icon-btn"
              onClick={() => setDate(addDays(date, -7))}
              aria-label="上一周"
            >
              <ChevronLeft size={18} />
            </button>
            <label className="date-picker">
              <CalendarDays size={18} />
              <span>
                {current.getFullYear()} 年 {current.getMonth() + 1} 月
              </span>
              <input
                ref={dateRef}
                type="date"
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                aria-label="选择记录日期"
              />
            </label>
            <button
              className="icon-btn"
              onClick={() => setDate(addDays(date, 7))}
              aria-label="下一周"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="week-strip">
            {['一', '二', '三', '四', '五', '六', '日'].map((s, i) => {
              const d = addDays(monday, i);
              return (
                <button
                  key={d}
                  className={'day ' + (d === date ? 'selected' : '')}
                  onClick={() => setDate(d)}
                  aria-pressed={d === date}
                >
                  <span>周{s}</span>
                  <b>{d === today ? '今' : Number(d.slice(-2))}</b>
                  <i
                    className={
                      foods.some((f) => f.date === d) ? 'has-data' : ''
                    }
                  />
                </button>
              );
            })}
          </div>
          <button className="today-btn" onClick={() => setDate(today)}>
            回到今天
          </button>
        </div>
        <section className="summary card" aria-label="每日营养摄入">
          <div className="section-head">
            <h2>
              <span className="green-dot" />
              {date === today
                ? '今日'
                : `${current.getMonth() + 1}月${current.getDate()}日`}
              营养摄入
            </h2>
          </div>
          <div className="summary-body">
            <div className="energy">
              <div className="energy-ring">
                <div>
                  <span>已摄入</span>
                  <strong>{energy.toLocaleString()}</strong>
                  <small>千卡</small>
                </div>
              </div>
              <div className="energy-caption">
                <span className="fat-energy-share" aria-live="polite">
                  <span className="fat-share-label">
                    <i />
                    脂肪供能占比
                  </span>
                  <strong>
                    {fatEnergy.percent === null ? '—' : `${fatEnergy.percent}%`}
                  </strong>
                  <small>
                    {fatEnergy.percent === null
                      ? '记录饮食后显示'
                      : `脂肪提供 ${round(fatEnergy.fatKcal)} 千卡`}
                  </small>
                </span>
              </div>
            </div>
            <div className="macro-grid">
              {(
                [
                  { k: 'p', name: '蛋白质', en: 'PROTEIN', color: 'protein' },
                  { k: 'c', name: '碳水化合物', en: 'CARBS', color: 'carbs' },
                  { k: 'f', name: '脂肪', en: 'FAT', color: 'fat' },
                ] as const
              ).map((m) => (
                <div className={'macro ' + m.color} key={m.k}>
                  <div className="macro-name">
                    <i />
                    {m.name}
                  </div>
                  <div className="macro-value">
                    {round(sums[m.k])}
                    <span> g</span>
                  </div>
                  <div className="macro-foot">
                    <span>{m.en}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="summary-note">
            <Leaf size={15} />
            <span>每一份记录，都是更了解自己的开始。</span>
            <span className="sample-note">初始食物为示例 · 可修改或删除</span>
          </div>
        </section>
        <div className="content-grid">
          <section className="diary">
            <div className="diary-heading">
              <div>
                <h2>我的餐盘</h2>
              </div>
              <span className="record-count">已记录 {daily.length} 份食物</span>
            </div>
            {meals.map((meal, index) => {
              const entries = daily.filter((f) => f.meal === meal);
              const Icon = mealIcons[index];
              return (
                <article
                  key={meal}
                  className={
                    'meal-card card ' + (!entries.length ? 'empty-meal' : '')
                  }
                >
                  <div className="meal-heading">
                    <div className={'meal-icon meal-' + index}>
                      <Icon size={20} />
                    </div>
                    <h3>{meal}</h3>
                    <span className="meal-calories">
                      {entries.length ? (
                        <>
                          <b>{kcal(total(entries))}</b> 千卡
                        </>
                      ) : (
                        mealTimes[index]
                      )}
                    </span>
                  </div>
                  {entries.map((f) => (
                    <button
                      key={f.id}
                      className="food-row"
                      onClick={() => {
                        setDraft({ ...f });
                        setError('');
                        setModal('edit');
                      }}
                    >
                      <div className="food-photo">
                        {f.photo ? (
                          <img src={f.photo} alt={f.name} />
                        ) : (
                          <Utensils size={26} />
                        )}
                      </div>
                      <div className="food-info">
                        <h4>
                          {f.name}
                          {f.sample && <span className="sample-tag">示例</span>}
                        </h4>
                        <p>
                          {f.grams} 克<span>·</span>
                          {f.time}
                        </p>
                        <div className="food-macros">
                          <span>
                            <i className="p-dot" />
                            蛋白质 {round(f.p)}g
                          </span>
                          <span>
                            <i className="c-dot" />
                            碳水 {round(f.c)}g
                          </span>
                          <span>
                            <i className="f-dot" />
                            脂肪 {round(f.f)}g
                          </span>
                        </div>
                      </div>
                      <div className="food-energy">
                        <strong>{kcal(f)}</strong>
                        <span>千卡</span>
                      </div>
                      <ChevronRight className="row-arrow" size={16} />
                    </button>
                  ))}
                  {!entries.length && (
                    <div className="empty-row" aria-label={meal + '暂无记录'}>
                      <span className="empty-plus">
                        <Plus size={19} />
                      </span>
                      <span>还没记录{meal}</span>
                    </div>
                  )}
                </article>
              );
            })}
            <p className="local-note">
              <span className="green-dot" />
              记录仅保存在当前浏览器 ·{' '}
              {endpoint ? '照片将发送至已配置的识别服务' : '照片识别为示例体验'}
            </p>
          </section>
        </div>
      </main>
      <div className="mobile-action">
        <button className="primary" onClick={() => start()}>
          <Camera size={20} />
          拍照记饮食
        </button>
      </div>
      <Dialog open={modal !== null} onOpenChange={(v) => !v && close()}>
        <DialogContent className="app-dialog">
          <DialogTitle className="dialog-title">
            {modal === 'edit'
              ? draft.id
                ? '编辑饮食记录'
                : '确认食物与营养'
              : '记录这一餐'}
          </DialogTitle>
          <DialogDescription>
            {modal === 'edit'
              ? '确认食物、份量和餐次后，再加入饮食日记。'
              : '拍下餐盘，或从相册选择一张食物照片。'}
          </DialogDescription>
          {modal === 'add' && (
            <>
              <div
                className="upload-area"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  pick(e.dataTransfer.files[0]);
                }}
              >
                {photo ? (
                  <>
                    <img src={photo} alt="待记录食物照片" />
                    <button
                      className="remove-photo"
                      aria-label="移除照片"
                      onClick={() => {
                        setPhoto('');
                        setFile(null);
                      }}
                    >
                      <X size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="upload-icon">
                      <ScanLine size={38} />
                    </span>
                    <h3>把这一餐，放进食光</h3>
                    <p>支持 JPG、PNG、WebP，最大 10 MB</p>
                  </>
                )}
              </div>
              <input
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                ref={uploadRef}
                onChange={(e) => {
                  pick(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <input
                hidden
                type="file"
                accept="image/*"
                capture="environment"
                ref={cameraRef}
                onChange={(e) => {
                  pick(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <div className="upload-actions">
                <button
                  className="secondary"
                  onClick={() => cameraRef.current?.click()}
                  disabled={busy}
                >
                  <Camera size={18} />
                  拍一张
                </button>
                <button
                  className="secondary"
                  onClick={() => uploadRef.current?.click()}
                  disabled={busy}
                >
                  <ImagePlus size={18} />
                  从相册选择
                </button>
              </div>
              <div className="demo-notice">
                <Info size={17} />
                <span>
                  {endpoint
                    ? '点击识别后，照片将发送至已配置的服务进行解析。请在保存前核对估算结果。'
                    : '当前为示例模式。照片不会上传，展示固定示例营养值，不代表照片的实际识别结果。'}
                </span>
              </div>
              <button
                className="primary full"
                disabled={busy || Boolean(endpoint && !file)}
                onClick={analyze}
              >
                {busy ? (
                  <>
                    <LoaderCircle className="spin" size={18} />
                    {endpoint ? '正在解析食物…' : '正在准备示例结果…'}
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    {endpoint
                      ? '解析食物照片'
                      : photo
                        ? '使用照片体验示例'
                        : '体验示例识别'}
                  </>
                )}
              </button>
            </>
          )}
          {modal === 'edit' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
              className="edit-form"
            >
              {draft.sample && (
                <div className="demo-notice">
                  <Info size={16} />
                  <span>示例营养数据，可按实际食物修改。</span>
                </div>
              )}
              {draft.photo && (
                <img
                  className="edit-photo"
                  src={draft.photo}
                  alt={draft.name || '食物照片'}
                />
              )}
              <label>
                食物名称
                <input
                  required
                  maxLength={80}
                  placeholder="例如：鸡胸肉蔬菜沙拉"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <div className="two-fields">
                <label>
                  餐次
                  <Select
                    value={draft.meal}
                    onValueChange={(v) =>
                      v && setDraft({ ...draft, meal: v as Meal })
                    }
                  >
                    <SelectTrigger
                      className="meal-select"
                      aria-label="选择餐次"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {meals.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label>
                  食物份量（克）
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10000"
                    required
                    value={draft.grams || ''}
                    onChange={(e) => {
                      if (e.target.value && Number(e.target.value) > 0)
                        changeGrams(Number(e.target.value));
                    }}
                  />
                </label>
              </div>
              <span className="field-hint">
                调整份量时，营养数据将按比例换算。
              </span>
              <div className="nutrition-fields">
                {(
                  [
                    { k: 'p', label: '蛋白质' },
                    { k: 'c', label: '碳水化合物' },
                    { k: 'f', label: '脂肪' },
                  ] as const
                ).map((m) => (
                  <label key={m.k}>
                    {m.label}（g）
                    <input
                      required
                      type="number"
                      step="0.1"
                      min="0"
                      max="10000"
                      value={draft[m.k]}
                      onChange={(e) =>
                        setDraft({ ...draft, [m.k]: Number(e.target.value) })
                      }
                    />
                  </label>
                ))}
              </div>
              <div className="calorie-preview">
                这份食物的能量
                <strong>
                  {kcal(draft)} <small>千卡</small>
                </strong>
              </div>
              <button type="submit" className="primary full">
                <Check size={18} />
                {draft.id ? '保存修改' : '记录到' + draft.meal}
              </button>
              {draft.id && (
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => {
                    const removed = draft;
                    setFoods((a) => a.filter((f) => f.id !== draft.id));
                    close();
                    toast.add({
                      title: '已删除记录',
                      actionProps: {
                        children: '撤销',
                        onClick: () =>
                          setFoods((a) =>
                            a.some((f) => f.id === removed.id)
                              ? a
                              : [...a, removed],
                          ),
                      },
                    });
                  }}
                >
                  <Trash2 size={15} />
                  删除这条记录
                </button>
              )}
            </form>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
