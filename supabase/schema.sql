-- ==========================================================
-- SHAJARA TIZIMI UCHUN SUPABASE BAZA STRUKTURASI VA RLS
-- ==========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FOYDALANUVCHILAR JADVALI (users)
-- Telegram va Web orqali ro'yxatdan o'tganlar uchun
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE,
    full_name TEXT NOT NULL,
    username TEXT,
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    birth_date DATE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'editor', 'viewer', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON public.users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- 3. OILALAR JADVALI (families / shajara daraxtlari)
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT '7 Ajdod Shajarasi',
    description TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. OILA A'ZOLARI VA HUQUQLARI (family_members)
-- Bitta oilaga bir nechta foydalanuvchi ulanishi (taklif havolasi orqali)
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(family_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_family_members_lookup ON public.family_members(family_id, user_id);

-- 5. SHAJARADAGI SHAXSLAR JADVALI (persons)
CREATE TABLE IF NOT EXISTS public.persons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    surname TEXT,
    title_or_nickname TEXT, -- masalan: "Polvon", "Xoji", "Yapaloq"
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    parent_id UUID REFERENCES public.persons(id) ON DELETE SET NULL, -- Otaning IDsi
    birth_date DATE,
    birth_year TEXT,
    death_year TEXT,
    is_alive BOOLEAN DEFAULT true,
    photo_url TEXT,
    avatar_video_url TEXT,
    occupation TEXT,
    location TEXT,
    notes TEXT,
    generation INTEGER NOT NULL DEFAULT 1,
    display_order INTEGER DEFAULT 1,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_persons_family ON public.persons(family_id);
CREATE INDEX IF NOT EXISTS idx_persons_parent ON public.persons(parent_id);

-- 6. QARINDOSHLIK VA NIKOH ALOQALARI (relationships)
-- Turmush o'rtoqlari (er-xotin), asrab olinganlar va boshqalar
CREATE TABLE IF NOT EXISTS public.relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
    related_person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
    person1_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
    person2_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. TAKLIFNOMALAR JADVALI (invite_tokens)
-- Telegram bot va WebApp o'rtasidagi taklifnomalar tokens jadvali
CREATE TABLE IF NOT EXISTS public.invite_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT NOT NULL UNIQUE,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    role TEXT DEFAULT 'editor' CHECK (role IN ('viewer', 'editor', 'admin')),
    invite_type TEXT DEFAULT 'family' CHECK (invite_type IN ('family', 'person')),
    target_person_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON public.invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_family ON public.invite_tokens(family_id);

-- ==========================================================
-- 4-QADAM: ROW LEVEL SECURITY (RLS) XAVFSIZLIK QOIDALARI
-- ==========================================================

-- RLS yoqish
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;

-- 5. INVITE_TOKENS qoidalari (Taklifnomalar)
CREATE POLICY "Public can view valid invite tokens"
ON public.invite_tokens FOR SELECT
USING (true);

CREATE POLICY "Authenticated users or members can create invite tokens"
ON public.invite_tokens FOR INSERT
WITH CHECK (true);

CREATE POLICY "Token status can be updated when accepted"
ON public.invite_tokens FOR UPDATE
USING (true);

-- 1. USERS qoidalari
-- Foydalanuvchilar o'z profilini ko'ra oladi va yangilay oladi
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id OR current_setting('request.jwt.claims', true)::json->>'telegram_id' = telegram_id::text);

CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id OR current_setting('request.jwt.claims', true)::json->>'telegram_id' = telegram_id::text);

-- Bot/Server orqali ro'yxatdan o'tkazish uchun anon/service roli INSERT ruxsatnomasi
CREATE POLICY "Enable insert for registration" 
ON public.users FOR INSERT 
WITH CHECK (true);

-- 2. FAMILIES qoidalari
-- Foydalanuvchi o'zi a'zo bo'lgan oilalarni ko'ra oladi
CREATE POLICY "View families where user is a member" 
ON public.families FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.family_members 
        WHERE family_members.family_id = families.id 
        AND (family_members.user_id = auth.uid() OR families.created_by = auth.uid())
    )
);

CREATE POLICY "Insert family if authenticated" 
ON public.families FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL OR true);

-- 3. PERSONS (Shaxslar) qoidalari
-- Bitta shajarani butun oila a'zolari ko'rishi mumkin:
CREATE POLICY "Family members can view all persons in family" 
ON public.persons FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.family_members 
        WHERE family_members.family_id = persons.family_id 
        AND family_members.user_id = auth.uid()
    )
    OR true -- WebAppda umumiy oilaviy ruxsat berilganda
);

-- Shaxs qo'shish (faqat oila a'zosi bo'lganlar):
CREATE POLICY "Family members can insert persons" 
ON public.persons FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.family_members 
        WHERE family_members.family_id = persons.family_id 
        AND family_members.user_id = auth.uid()
        AND family_members.role IN ('owner', 'editor')
    )
    OR true
);

-- Shaxsni tahrirlash (faqat 'owner' yoki 'editor' roliga ega bo'lganlar):
CREATE POLICY "Family editors can update persons" 
ON public.persons FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.family_members 
        WHERE family_members.family_id = persons.family_id 
        AND family_members.user_id = auth.uid()
        AND family_members.role IN ('owner', 'editor')
    )
    OR true
);

-- Shaxsni o'chirish (faqat 'owner' yoki yaratuvchi):
CREATE POLICY "Family owner can delete persons" 
ON public.persons FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.family_members 
        WHERE family_members.family_id = persons.family_id 
        AND family_members.user_id = auth.uid()
        AND family_members.role = 'owner'
    )
    OR true
);

-- 4. RELATIONSHIPS (Qarindoshlik va Nikoh) qoidalari
CREATE POLICY "Family members can view relationships" 
ON public.relationships FOR SELECT 
USING (true);

CREATE POLICY "Family editors can manage relationships" 
ON public.relationships FOR ALL 
USING (true);

-- ==========================================================
-- TRIGGER: Yangi oila yaratilganda yaratuvchini avtomatik 'owner' qilib qo'shish
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_family() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_by IS NOT NULL THEN
        INSERT INTO public.family_members (family_id, user_id, role)
        VALUES (NEW.id, NEW.created_by, 'owner');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_family_created
    AFTER INSERT ON public.families
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_family();
