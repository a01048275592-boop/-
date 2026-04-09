// ============================================================
// anhani.com - 교육 과외 동적 페이지 생성 Worker
// ============================================================

// --- 해시 함수 (결정적 랜덤) ---
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 16807 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN(arr, n, rng) {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

// --- 지역 데이터 ---
const REGIONS = {
  "서울": ["강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구","노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구","성북구","송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구"],
  "부산": ["강서구","금정구","기장군","남구","동구","동래구","부산진구","북구","사상구","사하구","서구","수영구","연제구","영도구","중구","해운대구"],
  "대구": ["남구","달서구","달성군","동구","북구","서구","수성구","중구"],
  "인천": ["강화군","계양구","남동구","동구","미추홀구","부평구","서구","연수구","옹진군","중구"],
  "광주": ["광산구","남구","동구","북구","서구"],
  "대전": ["대덕구","동구","서구","유성구","중구"],
  "울산": ["남구","동구","북구","울주군","중구"],
  "세종": ["세종시"],
  "경기": ["가평군","고양시","과천시","광명시","광주시","구리시","군포시","김포시","남양주시","동두천시","부천시","성남시","수원시","시흥시","안산시","안성시","안양시","양주시","양평군","여주시","연천군","오산시","용인시","의왕시","의정부시","이천시","파주시","평택시","포천시","하남시","화성시"],
  "강원": ["강릉시","고성군","동해시","삼척시","속초시","양구군","양양군","영월군","원주시","인제군","정선군","철원군","춘천시","태백시","평창군","홍천군","화천군","횡성군"],
  "충북": ["괴산군","단양군","보은군","영동군","옥천군","음성군","제천시","증평군","진천군","청주시","충주시"],
  "충남": ["계룡시","공주시","금산군","논산시","당진시","보령시","부여군","서산시","서천군","아산시","예산군","천안시","청양군","태안군","홍성군"],
  "전북": ["고창군","군산시","김제시","남원시","무주군","부안군","순창군","완주군","익산시","임실군","장수군","전주시","정읍시","진안군"],
  "전남": ["강진군","고흥군","곡성군","광양시","구례군","나주시","담양군","목포시","무안군","보성군","순천시","신안군","여수시","영광군","영암군","완도군","장성군","장흥군","진도군","함평군","해남군","화순군"],
  "경북": ["경산시","경주시","고령군","구미시","군위군","김천시","문경시","봉화군","상주시","성주군","안동시","영덕군","영양군","영주시","영천시","예천군","울릉군","울진군","의성군","청도군","청송군","칠곡군","포항시"],
  "경남": ["거제시","거창군","고성군","김해시","남해군","밀양시","사천시","산청군","양산시","의령군","진주시","창녕군","창원시","통영시","하동군","함안군","함양군","합천군"],
  "제주": ["제주시","서귀포시"]
};

// 읍/면 데이터 (주요 군 단위)
const EUP_MYEON = {
  "기장군": ["기장읍","장안읍","정관읍","일광면","철마면"],
  "달성군": ["화원읍","논공읍","다사읍","유가읍","옥포읍","현풍읍","가창면","구지면","하빈면"],
  "강화군": ["강화읍","선원면","불은면","길상면","화도면","양도면","내가면","하점면","송해면","교동면"],
  "옹진군": ["북도면","백령면","대청면","덕적면","영흥면","자월면","연평면"],
  "울주군": ["온산읍","언양읍","범서읍","청량읍","삼남읍","상북면","삼동면","서생면","두동면","두서면","웅촌면"],
  "가평군": ["가평읍","설악면","청평면","상면","조종면","북면"],
  "양평군": ["양평읍","강상면","강하면","양서면","옥천면","서종면","단월면","청운면","양동면","지평면","용문면"],
  "연천군": ["연천읍","전곡읍","청산면","백학면","미산면","왕징면","신서면","중면","장남면"],
  "고성군": ["간성읍","거진읍","현내면","죽왕면","토성면","수동면"],
  "양구군": ["양구읍","남면","동면","방산면","해안면"],
  "양양군": ["양양읍","서면","손양면","현북면","현남면","강현면"],
  "영월군": ["영월읍","상동읍","무릉도원면","남면","한반도면","김삿갓면","북면","주천면"],
  "인제군": ["인제읍","남면","북면","기린면","서화면","상남면"],
  "정선군": ["정선읍","고한읍","사북읍","신동읍","남면","북평면","임계면","화암면","여량면"],
  "철원군": ["갈말읍","동송읍","김화읍","서면","근남면","근북면","근동면"],
  "평창군": ["평창읍","미탄면","방림면","대화면","봉평면","용평면","진부면","대관령면"],
  "홍천군": ["홍천읍","화촌면","두촌면","내촌면","서석면","동면","남면","서면","북방면","내면"],
  "화천군": ["화천읍","간동면","하남면","상서면","사내면"],
  "횡성군": ["횡성읍","우천면","안흥면","둔내면","갑천면","청일면","공근면","서원면"],
  "괴산군": ["괴산읍","감물면","장연면","연풍면","칠성면","문광면","청안면","청천면","사리면","소수면","불정면"],
  "단양군": ["단양읍","매포읍","적성면","대강면","가곡면","영춘면","어상천면"],
  "보은군": ["보은읍","속리산면","장안면","마로면","탄부면","삼승면","수한면","회남면","내북면","산외면","외속리면"],
  "영동군": ["영동읍","용산면","황간면","추풍령면","매곡면","상촌면","양강면","용화면","학산면","양산면"],
  "옥천군": ["옥천읍","동이면","안남면","안내면","청성면","청산면","이원면","군서면","군북면"],
  "음성군": ["음성읍","금왕읍","소이면","원남면","맹동면","대소면","삼성면","생극면","감곡면"],
  "증평군": ["증평읍","도안면"],
  "진천군": ["진천읍","덕산읍","초평면","문백면","백곡면","이월면","광혜원면"],
  "금산군": ["금산읍","금성면","제원면","부리면","군북면","남일면","남이면","진산면","복수면","추부면"],
  "부여군": ["부여읍","규암면","은산면","외산면","내산면","구룡면","홍산면","옥산면","남면","충화면","양화면","임천면","장암면","석성면","초촌면","세도면"],
  "서천군": ["서천읍","장항읍","기산면","한산면","화양면","비인면","서면","문산면","판교면","종천면","마서면","시초면"],
  "예산군": ["예산읍","삽교읍","대술면","신양면","광시면","대흥면","응봉면","덕산면","봉산면","고덕면","신암면","오가면"],
  "청양군": ["청양읍","운곡면","대치면","정산면","목면","청남면","장평면","남양면","화성면","비봉면"],
  "태안군": ["태안읍","안면읍","고남면","남면","근흥면","소원면","원북면","이원면"],
  "홍성군": ["홍성읍","광천읍","홍북읍","금마면","홍동면","장곡면","은하면","결성면","서부면","갈산면","구항면"],
  "고창군": ["고창읍","고수면","아산면","무장면","공음면","상하면","해리면","성송면","대산면","심원면","흥덕면","성내면","신림면","부안면"],
  "무주군": ["무주읍","무풍면","설천면","적상면","안성면","부남면"],
  "부안군": ["부안읍","줄포면","보안면","변산면","진서면","백산면","상서면","동진면","주산면","위도면","하서면","계화면"],
  "순창군": ["순창읍","인계면","동계면","적성면","유등면","풍산면","금과면","팔덕면","쌍치면","복흥면","구림면"],
  "완주군": ["삼례읍","봉동읍","용진읍","상관면","이서면","소양면","구이면","고산면","비봉면","운주면","화산면","동상면","경천면"],
  "임실군": ["임실읍","청웅면","운암면","신평면","삼계면","관촌면","신덕면","성수면","오수면","강진면","덕치면","지사면"],
  "장수군": ["장수읍","산서면","번암면","장계면","천천면","계남면","계북면"],
  "진안군": ["진안읍","용담면","안천면","동향면","마령면","성수면","백운면","부귀면","정천면","주천면","상전면"],
  "강진군": ["강진읍","군동면","칠량면","대구면","도암면","신전면","성전면","작천면","병영면","옴천면","마량면"],
  "고흥군": ["고흥읍","도양읍","풍양면","도덕면","금산면","도화면","포두면","봉래면","점암면","과역면","남양면","동일면","대서면","두원면","영남면","동강면"],
  "곡성군": ["곡성읍","오곡면","삼기면","석곡면","목사동면","죽곡면","고달면","옥과면","입면","겸면","오산면"],
  "구례군": ["구례읍","문척면","간전면","토지면","마산면","광의면","용방면","산동면"],
  "담양군": ["담양읍","봉산면","고서면","남면","창평면","대덕면","무정면","금성면","용면","월산면","수북면","대전면"],
  "무안군": ["무안읍","일로읍","삼향읍","몽탄면","청계면","현경면","망운면","해제면","운남면"],
  "보성군": ["보성읍","벌교읍","노동면","미력면","겸백면","율어면","복내면","문덕면","조성면","득량면","회천면","웅치면"],
  "신안군": ["지도읍","압해읍","증도면","임자면","자은면","비금면","도초면","흑산면","하의면","신의면","장산면","안좌면","팔금면","암태면"],
  "영광군": ["영광읍","백수읍","홍농읍","대마면","묘량면","불갑면","군서면","군남면","염산면","법성면","낙월면"],
  "영암군": ["영암읍","삼호읍","덕진면","금정면","신북면","시종면","도포면","군서면","서호면","학산면","미암면"],
  "완도군": ["완도읍","금일읍","노화읍","군외면","신지면","고금면","약산면","청산면","소안면","금당면","보길면","생일면"],
  "장성군": ["장성읍","남면","동화면","삼서면","삼계면","황룡면","서삼면","북일면","북이면","북하면","진원면"],
  "장흥군": ["장흥읍","관산읍","대덕읍","용산면","안양면","장동면","장평면","유치면","부산면","회진면"],
  "진도군": ["진도읍","군내면","고군면","의신면","임회면","지산면","조도면"],
  "함평군": ["함평읍","손불면","신광면","학교면","엄다면","대동면","나산면","해보면","월야면"],
  "해남군": ["해남읍","삼산면","화산면","현산면","송지면","북평면","북일면","옥천면","계곡면","마산면","황산면","산이면","문내면","화원면"],
  "화순군": ["화순읍","한천면","춘양면","청풍면","이양면","능주면","도곡면","도암면","이서면","북면","동복면","남면","동면"],
  "고령군": ["대가야읍","덕곡면","운수면","성산면","다산면","개진면","우곡면","쌍림면"],
  "군위군": ["군위읍","소보면","효령면","부계면","우보면","의흥면","산성면","삼국유사면"],
  "봉화군": ["봉화읍","물야면","봉성면","법전면","춘양면","소천면","재산면","명호면","상운면","석포면"],
  "성주군": ["성주읍","선남면","용암면","수륜면","가천면","금수면","대가면","벽진면","초전면","월항면"],
  "영덕군": ["영덕읍","강구면","남정면","달산면","지품면","축산면","영해면","병곡면","창수면"],
  "영양군": ["영양읍","입암면","청기면","일월면","수비면","석보면"],
  "예천군": ["예천읍","용문면","효자면","은풍면","감천면","보문면","호명면","유천면","용궁면","개포면","지보면","풍양면"],
  "울릉군": ["울릉읍","서면","북면"],
  "울진군": ["울진읍","평해읍","북면","근남면","온정면","기성면","죽변면","후포면","금강송면","매화면"],
  "의성군": ["의성읍","단촌면","점곡면","옥산면","사곡면","춘산면","가음면","금성면","봉양면","비안면","구천면","단밀면","단북면","안계면","다인면","신평면","안사면"],
  "청도군": ["청도읍","화양읍","풍각면","각남면","이서면","운문면","금천면","매전면"],
  "청송군": ["청송읍","부동면","부남면","현동면","현서면","안덕면","진보면","파천면"],
  "칠곡군": ["왜관읍","북삼읍","석적읍","동명면","가산면","지천면","약목면"],
  "거창군": ["거창읍","주상면","웅양면","고제면","북상면","위천면","마리면","남상면","남하면","신원면","가조면","가북면"],
  "고성군(경남)": ["고성읍","삼산면","하일면","하이면","상리면","대가면","영현면","영오면","개천면","구만면","회화면","마암면","동해면","거류면"],
  "남해군": ["남해읍","이동면","상주면","삼동면","미조면","남면","서면","고현면","설천면","창선면"],
  "산청군": ["산청읍","차황면","오부면","생초면","금서면","삼장면","시천면","단성면","신안면","신등면","생비량면"],
  "의령군": ["의령읍","가례면","칠곡면","대의면","화정면","용덕면","정곡면","지정면","낙서면","부림면","봉수면","궁류면","유곡면"],
  "창녕군": ["창녕읍","남지읍","고암면","성산면","대합면","이방면","유어면","대지면","계성면","영산면","장마면","도천면","길곡면","부곡면"],
  "하동군": ["하동읍","화개면","악양면","적량면","횡천면","고전면","금남면","진교면","양보면","북천면","청암면","옥종면","금성면"],
  "함안군": ["가야읍","칠원읍","함안면","여항면","군북면","법수면","대산면","산인면"],
  "함양군": ["함양읍","마천면","휴천면","유림면","수동면","지곡면","안의면","서하면","서상면","백전면","병곡면"],
  "합천군": ["합천읍","봉산면","야로면","묘산면","가야면","야천면","율곡면","초계면","쌍책면","덕곡면","청덕면","적중면","대양면","쌍백면","삼가면","가회면","대병면","용주면"]
};

const LEVELS = ["초등", "중등", "고등"];
const SUBJECTS = ["국어", "영어", "수학", "사회", "과학", "코딩", "검정고시", "논술"];

// --- 콘텐츠 템플릿 풀 ---

const OPENINGS = [
  (loc, lvl, subj) => `안녕하세요, ${loc} 지역에서 ${lvl}학생 ${subj} 과외를 알아보고 계신 학부모님 또는 학생 여러분! 오늘은 ${loc}에서 ${subj} 과외를 어떻게 시작하면 좋을지, 실제 경험을 바탕으로 상세하게 알려드리려고 합니다. 저도 처음에는 막막했는데, 직접 발로 뛰면서 알게 된 정보들을 정리해 봤어요.`,
  (loc, lvl, subj) => `${loc}에서 ${lvl} ${subj} 과외 찾으시나요? 요즘 ${loc} 학부모님들 사이에서 ${subj} 과외에 대한 관심이 정말 뜨겁더라고요. 주변 맘카페에서도 자주 올라오는 주제인데, 제가 직접 경험하고 정리한 내용을 공유해 드릴게요.`,
  (loc, lvl, subj) => `${lvl}학생 자녀를 둔 학부모님이라면 ${subj} 과외 한 번쯤 고민해 보셨을 거예요. 특히 ${loc} 지역은 교육열이 높아서 좋은 선생님을 찾는 게 쉽지 않은데요. 오늘은 ${loc}에서 ${subj} 과외를 효과적으로 찾는 방법을 알려드릴게요.`,
  (loc, lvl, subj) => `혹시 ${loc}에서 ${lvl} ${subj} 과외를 알아보고 계시다면, 이 글이 큰 도움이 될 거예요. 과외비 시세부터 좋은 선생님 고르는 법, 실제 수업 후기까지 꼼꼼하게 정리했거든요. 저도 아이 과외를 시작하면서 이런 정보가 있었으면 했는데, 없어서 직접 만들었습니다.`,
  (loc, lvl, subj) => `${loc} ${lvl} ${subj} 과외, 어디서부터 시작해야 할지 고민이시죠? 저도 같은 고민을 했던 학부모로서, ${loc} 지역 과외 시장의 현실적인 이야기를 들려드리겠습니다. 읽고 나시면 훨씬 명확한 기준이 생기실 거예요.`,
  (loc, lvl, subj) => `요즘 ${loc}에서 ${subj} 과외 수요가 크게 늘었다는 거 아시나요? ${lvl}학생 학부모님들 사이에서 입소문이 퍼지면서, 검증된 선생님을 찾기가 더 어려워졌다고 해요. 이 글에서는 ${loc} 지역 ${subj} 과외의 모든 것을 정리해 드릴게요.`,
  (loc, lvl, subj) => `${loc}에 사시면서 ${lvl} 자녀의 ${subj} 실력이 걱정되시나요? 학원을 보내자니 시간이 안 맞고, 과외를 알아보자니 정보가 부족하고... 이런 고민을 하고 계셨다면 제가 도움을 드릴 수 있을 것 같아요. ${loc} 지역 ${subj} 과외에 대해 하나하나 알려드릴게요.`,
  (loc, lvl, subj) => `아이의 ${subj} 성적이 걱정되시는 ${loc} 학부모님, 반갑습니다! ${lvl} 시기는 학습 습관이 정말 중요한 때인데요. ${loc}에서 어떤 ${subj} 과외가 우리 아이에게 맞을지, 꼼꼼하게 비교해 보겠습니다.`,
  (loc, lvl, subj) => `이 글을 클릭하신 분이라면 아마 ${loc}에서 믿을 만한 ${lvl} ${subj} 과외 선생님을 찾고 계시는 분일 거예요. 과외는 선생님과의 궁합이 정말 중요한데, 좋은 선생님을 만나려면 어떤 점을 확인해야 하는지 실제 사례와 함께 설명해 드리겠습니다.`,
  (loc, lvl, subj) => `${loc} ${subj} 과외 정보, 한 곳에 다 모았습니다! ${lvl}학생에게 딱 맞는 과외를 찾으시는 분들을 위해 비용, 커리큘럼, 선생님 선택 기준까지 총정리해 봤어요. 실제로 ${loc} 지역에서 과외를 진행한 분들의 이야기도 담았으니 끝까지 읽어보세요.`,
  (loc, lvl, subj) => `${loc}에서 아이 교육에 진심이신 분들 많으시죠? 오늘은 ${lvl} ${subj} 과외를 효과적으로 진행하는 방법에 대해 이야기해 볼까 해요. 단순히 과외 선생님만 구하는 게 아니라, 아이 성적을 실질적으로 올릴 수 있는 전략을 알려드릴게요.`,
  (loc, lvl, subj) => `${loc} 지역 맘카페에서 ${subj} 과외 관련 글이 자주 올라오는 거 보셨을 거예요. ${lvl} 시기에 ${subj} 기초를 잘 잡아놔야 이후 학습이 수월해지거든요. 오늘은 ${loc}에서 ${subj} 과외를 시작하기 전에 꼭 알아야 할 것들을 정리해 봤습니다.`,
  (loc, lvl, subj) => `솔직히 말씀드리면, ${loc}에서 좋은 ${lvl} ${subj} 과외를 찾는 건 쉽지 않아요. 하지만 몇 가지 핵심만 알면 훨씬 수월해집니다. 제가 직접 여러 과외 선생님을 만나보고 느낀 점들을 공유할 테니, 선택하실 때 참고해 주세요.`,
  (loc, lvl, subj) => `${loc}에서 ${lvl}학생 ${subj} 과외를 알아보는 것, 생각보다 신경 쓸 게 많죠? 과외비는 적정한지, 선생님 실력은 검증이 되는지, 우리 아이랑 잘 맞을지... 하나하나 체크해야 할 것들을 리스트로 만들어서 정리해 봤어요.`,
  (loc, lvl, subj) => `안녕하세요! ${loc}에서 ${subj} 과외를 시작한 지 벌써 6개월이 넘었는데요. ${lvl} 아이의 성적 변화와 함께, 과외를 시작하기 전에 알았으면 좋았을 것들을 모두 적어봤어요. ${loc} 지역 학부모님들께 도움이 되었으면 합니다.`,
];

const SUBJECT_CONTENT = {
  "국어": {
    why: [
      "국어는 모든 과목의 기본이 되는 과목이에요. 지문을 이해하는 능력, 글을 쓰는 능력은 다른 과목 성적에도 직접적인 영향을 미칩니다.",
      "국어 실력은 하루아침에 늘지 않아요. 꾸준한 독서와 함께 체계적인 문법, 독해 훈련이 필요한 과목이죠.",
      "요즘 수능 국어가 정말 어려워졌다는 거 다들 느끼고 계실 거예요. 비문학 지문의 난이도가 높아지면서 독해력의 중요성이 더욱 커졌습니다.",
    ],
    tip: [
      "국어 과외에서 가장 중요한 건 아이의 독해력 수준을 정확히 파악하는 거예요. 좋은 선생님은 첫 수업에서 아이의 수준을 테스트하고, 그에 맞는 맞춤 커리큘럼을 짜줍니다.",
      "국어 과외를 고를 때는 문학과 비문학을 균형 있게 다루는지 확인하세요. 한쪽에만 치우친 수업은 실력 향상에 한계가 있어요.",
      "국어 과외 선생님을 선택할 때, 서술형 문제 첨삭 경험이 많은 분을 추천드려요. 요즘 시험에서 서술형 비중이 점점 높아지고 있거든요.",
    ],
    method: [
      "효과적인 국어 공부법은 매일 30분 이상 독서를 하면서, 주 2~3회 과외 수업에서 문제 풀이와 첨삭을 병행하는 거예요. 선생님이 아이의 약점을 정확히 짚어주면 성적 향상 속도가 빨라집니다.",
      "국어 과외에서는 지문 분석 능력을 키우는 게 핵심이에요. 선생님과 함께 지문을 읽고, 구조를 파악하고, 핵심 논지를 정리하는 연습을 반복하면 실력이 눈에 띄게 좋아집니다.",
    ]
  },
  "영어": {
    why: [
      "영어는 글로벌 시대에 필수적인 과목이죠. 단순히 시험 성적뿐만 아니라, 앞으로의 진로에도 큰 영향을 미치는 과목이에요.",
      "영어는 언어 과목이라 어릴 때부터 꾸준히 노출되는 게 중요해요. 과외를 통해 말하기, 듣기, 읽기, 쓰기를 균형 있게 발전시킬 수 있습니다.",
      "내신 영어와 수능 영어는 접근법이 다르다는 거 아시죠? 과외를 통해 각 시험에 맞는 전략을 배우는 게 효율적이에요.",
    ],
    tip: [
      "영어 과외 선생님을 고를 때는 발음보다 문법과 독해 지도 능력을 우선으로 보세요. 특히 시험 대비라면 정확한 문법 설명 능력이 중요합니다.",
      "좋은 영어 과외 선생님은 아이의 수준에 맞는 원서나 영어 지문을 준비해 와요. 교과서만 반복하는 수업은 피하시는 게 좋습니다.",
      "영어 과외에서는 단어 암기 관리를 꼼꼼히 해주는 선생님이 좋아요. 매 수업 시작 전 단어 테스트를 하는 선생님이라면 신뢰할 수 있습니다.",
    ],
    method: [
      "영어 과외의 핵심은 반복 노출이에요. 주 2~3회 수업에서 문법과 독해를 배우고, 나머지 날에는 영어 듣기와 단어 암기를 꾸준히 하는 패턴이 가장 효과적입니다.",
      "영어 성적을 빠르게 올리고 싶다면, 기출문제 분석이 중요해요. 좋은 과외 선생님은 시험 출제 패턴을 분석해서 자주 나오는 유형을 집중적으로 훈련시켜 줍니다.",
    ]
  },
  "수학": {
    why: [
      "수학은 누적형 과목이에요. 앞 단원을 이해하지 못하면 다음 단원도 막히기 때문에, 빈 곳을 정확히 찾아서 채워주는 과외가 효과적입니다.",
      "수학 성적은 자신감과 직결돼요. 한 번 자신감을 잃으면 회복이 어렵기 때문에, 수준에 맞는 맞춤 과외로 작은 성공 경험을 쌓아주는 게 중요합니다.",
      "수학은 혼자 공부하기 어려운 과목 중 하나예요. 막히는 문제를 바로 질문하고 해결할 수 있는 과외 환경이 학원보다 유리한 경우가 많습니다.",
    ],
    tip: [
      "수학 과외 선생님은 풀이 과정을 여러 가지 방법으로 설명할 수 있는 분이 좋아요. 한 가지 풀이법만 고집하는 선생님은 아이의 이해도에 맞추기 어렵습니다.",
      "수학 과외를 시작하기 전에, 아이가 어느 단원부터 막히는지 정확히 진단하는 게 중요해요. 좋은 선생님은 첫 수업에서 진단 테스트를 진행합니다.",
      "수학은 연습량이 중요해요. 과외 수업 외에 충분한 숙제를 내주고, 다음 수업에서 꼼꼼히 확인해주는 선생님을 선택하세요.",
    ],
    method: [
      "수학 과외에서 가장 효과적인 방법은 개념 설명 → 기본 문제 → 응용 문제 → 오답 정리 순서로 진행하는 거예요. 이 과정을 반복하면 실력이 탄탄해집니다.",
      "수학은 오답 노트가 정말 중요해요. 과외 선생님과 함께 틀린 문제를 분석하고, 왜 틀렸는지 기록하면 같은 실수를 반복하지 않게 됩니다.",
    ]
  },
  "사회": {
    why: [
      "사회 과목은 암기만으로는 한계가 있어요. 개념을 이해하고 다양한 사례에 적용할 수 있는 능력이 필요하죠. 과외를 통해 체계적으로 정리하면 시험에서 훨씬 유리합니다.",
      "사회는 넓은 범위를 효율적으로 공부해야 하는 과목이에요. 과외를 통해 핵심 개념을 빠르게 잡고, 자주 출제되는 유형을 연습하는 게 효과적입니다.",
      "요즘 사회 시험은 단순 암기보다 자료 분석 능력을 요구해요. 그래프, 도표, 지도 등을 해석하는 연습을 과외에서 집중적으로 하면 성적이 크게 오릅니다.",
    ],
    tip: [
      "사회 과외 선생님은 시사 이슈와 교과 내용을 연결해서 설명할 수 있는 분이 좋아요. 살아있는 예시로 배우면 기억에 오래 남거든요.",
      "사회 과외에서는 마인드맵이나 개념 정리 노트를 활용하는 선생님을 추천해요. 체계적인 정리가 사회 과목 성적의 핵심이에요.",
    ],
    method: [
      "사회 과외에서 효과적인 학습법은 핵심 개념 정리 → 기출문제 풀이 → 오답 분석 → 심화 자료 해석 순서입니다. 특히 자료 해석 능력을 키우면 고난도 문제도 거뜬해져요.",
      "사회는 스토리텔링 방식으로 공부하면 효과가 좋아요. 역사적 사건이나 사회 현상을 이야기처럼 풀어내는 선생님과 공부하면 재미있게 배울 수 있습니다.",
    ]
  },
  "과학": {
    why: [
      "과학은 실험과 관찰, 논리적 사고를 동시에 요구하는 과목이에요. 개념을 정확히 이해하고 문제에 적용하는 연습이 필요한데, 과외에서 1:1로 배우면 훨씬 효율적이에요.",
      "과학은 물리, 화학, 생물, 지구과학 각 영역마다 접근법이 달라요. 과외를 통해 아이가 약한 영역을 집중 공략할 수 있다는 게 큰 장점이죠.",
      "과학 실력은 개념 이해가 전부가 아니에요. 실험 결과를 분석하고, 그래프를 해석하고, 논리적으로 설명할 수 있어야 좋은 성적이 나와요.",
    ],
    tip: [
      "과학 과외 선생님은 실험 원리를 쉽게 설명해줄 수 있는 분이 좋아요. 단순 공식 암기가 아니라 왜 그런 결과가 나오는지 이해시켜주는 선생님을 찾으세요.",
      "과학 과외를 고를 때는 아이가 배우는 교과서 버전을 잘 아는 선생님인지 확인하세요. 출판사마다 다루는 실험이나 예시가 다를 수 있거든요.",
    ],
    method: [
      "과학 과외의 황금 패턴은 개념 설명 → 실험 원리 이해 → 문제 풀이 → 오답 분석이에요. 특히 실험 원리를 정확히 이해하면 응용 문제도 쉽게 풀 수 있습니다.",
      "과학 공부는 그림 그리기가 효과적이에요. 과외 수업에서 개념을 그림으로 정리하는 습관을 들이면, 복잡한 과정도 한눈에 파악할 수 있게 됩니다.",
    ]
  },
  "코딩": {
    why: [
      "코딩 교육은 이제 선택이 아닌 필수가 됐어요. 2025년부터 초중고 소프트웨어 교육이 강화되면서, 미리 준비하는 학생들이 크게 늘었습니다.",
      "코딩은 논리적 사고력과 문제 해결 능력을 키우는 데 최고의 과목이에요. 수학이나 과학 실력 향상에도 간접적으로 도움이 됩니다.",
      "AI 시대에 코딩을 배우는 것은 미래를 준비하는 가장 확실한 투자예요. 단순히 프로그래밍 기술을 넘어서 창의적 사고력까지 키울 수 있습니다.",
    ],
    tip: [
      "코딩 과외 선생님은 아이의 수준에 맞는 언어를 선택하는 게 중요해요. 초등학생은 스크래치나 엔트리, 중고등학생은 파이썬으로 시작하는 게 좋습니다.",
      "좋은 코딩 과외 선생님은 프로젝트 기반으로 수업해요. 게임 만들기, 앱 만들기 같은 프로젝트를 통해 배우면 아이가 흥미를 잃지 않아요.",
      "코딩 과외에서는 직접 코드를 작성하는 시간이 충분해야 해요. 선생님이 설명만 하고 학생은 듣기만 하는 수업은 효과가 떨어집니다.",
    ],
    method: [
      "코딩 과외에서 가장 효과적인 방법은 작은 프로젝트를 완성하는 거예요. 간단한 계산기 만들기부터 시작해서 점점 난이도를 높여가면 자연스럽게 실력이 향상됩니다.",
      "코딩은 에러를 고치는 과정에서 실력이 가장 많이 늘어요. 과외 수업에서 디버깅하는 방법을 체계적으로 배우면 혼자서도 문제를 해결할 수 있게 됩니다.",
    ]
  },
  "검정고시": {
    why: [
      "검정고시는 학력 인정을 받기 위한 중요한 시험이에요. 체계적인 준비 없이는 합격이 어렵기 때문에, 경험 많은 선생님의 도움이 필요합니다.",
      "검정고시는 범위가 넓고 과목이 많아서 혼자 준비하기 벅차요. 과외를 통해 효율적인 학습 계획을 세우고, 약점을 빠르게 보완하는 게 합격의 지름길이에요.",
      "검정고시 합격은 새로운 시작을 위한 중요한 발판이에요. 대학 진학이든 취업이든, 검정고시 합격 이후의 가능성은 무궁무진합니다.",
    ],
    tip: [
      "검정고시 과외 선생님은 출제 경향을 잘 아는 분이 좋아요. 자주 나오는 유형을 집중 공략하면 합격 확률이 크게 높아집니다.",
      "검정고시 과외에서 가장 중요한 건 시간 관리예요. 과목별 배점과 난이도를 고려해서 전략적으로 공부 시간을 배분하는 게 핵심입니다.",
      "검정고시 준비할 때 기출문제 분석이 정말 중요해요. 최근 5년간 기출문제를 완벽히 분석하면 합격은 어렵지 않습니다.",
    ],
    method: [
      "검정고시 과외에서 효과적인 학습 전략은 기출문제 분석 → 취약 과목 집중 → 모의고사 반복 → 실전 연습 순서예요. 특히 기출문제에서 반복 출제되는 개념을 완벽히 익히는 게 중요합니다.",
      "검정고시는 과목 수가 많으니까, 과외에서는 점수를 가장 빨리 올릴 수 있는 과목부터 집중하는 게 좋아요. 선생님과 함께 우선순위를 정하고 전략적으로 접근하세요.",
    ]
  },
  "논술": {
    why: [
      "논술은 대입에서 중요한 비중을 차지하는 전형이에요. 특히 상위권 대학을 목표로 한다면 논술 준비는 필수입니다.",
      "논술은 단순히 글을 잘 쓰는 것을 넘어서 비판적 사고력과 논리적 표현력을 요구해요. 혼자 공부하기 어렵고, 전문가의 첨삭과 피드백이 반드시 필요한 영역이에요.",
      "논술 실력은 체계적인 훈련 없이는 향상되기 어려워요. 제시문 분석, 논리 구성, 글쓰기까지 모든 과정에서 전문적인 지도가 필요합니다.",
    ],
    tip: [
      "논술 과외 선생님은 첨삭 경험이 풍부한 분이 좋아요. 단순히 '잘 썼다, 못 썼다'가 아니라 구체적인 개선점을 제시해줄 수 있어야 합니다.",
      "좋은 논술 과외 선생님은 다양한 주제에 대한 배경지식을 갖추고 있어요. 인문, 사회, 과학 등 여러 분야의 제시문을 다뤄본 경험이 있는지 확인하세요.",
      "논술 과외에서는 실제 시간 내에 글을 쓰는 연습이 중요해요. 시간 제한 없이 쓰는 것과 제한 시간 안에 쓰는 것은 완전히 다르거든요.",
    ],
    method: [
      "논술 과외에서 가장 효과적인 학습법은 제시문 분석 → 개요 작성 → 글쓰기 → 첨삭 → 재작성 순서예요. 특히 첨삭 후 재작성하는 과정에서 실력이 가장 많이 향상됩니다.",
      "논술은 많이 읽고 많이 쓰는 게 답이에요. 과외 수업에서 매주 1편 이상의 글을 쓰고, 선생님의 꼼꼼한 첨삭을 받으면 3개월 정도면 눈에 띄는 변화가 있습니다.",
    ]
  }
};

const LEVEL_CONTENT = {
  "초등": {
    char: [
      "초등학생 시기는 학습 습관을 형성하는 가장 중요한 때예요. 이때 올바른 공부 습관을 잡아주면 중학교, 고등학교에서도 큰 힘이 됩니다.",
      "초등학생은 집중 시간이 짧기 때문에, 재미있고 다양한 활동을 통해 배우는 게 효과적이에요. 좋은 과외 선생님은 이 점을 잘 이해하고 수업에 반영합니다.",
    ],
    price: "초등학생 과외비는 보통 시간당 2만 5천원~4만원 선이에요. 과목과 선생님 경력에 따라 차이가 있지만, 이 범위 안에서 찾으시면 적정 가격입니다.",
    duration: "초등학생은 주 2~3회, 회당 60~90분 수업이 적당해요. 너무 긴 수업은 오히려 집중력이 떨어질 수 있으니 적정 시간을 지키는 게 중요합니다.",
  },
  "중등": {
    char: [
      "중학생 시기는 기초를 탄탄히 다지는 때예요. 고등학교 내신과 수능을 위한 기반이 되는 시기이므로, 빈틈없이 학습하는 게 중요합니다.",
      "중학생은 사춘기와 맞물려 학습 의욕이 떨어질 수 있어요. 이때 좋은 과외 선생님은 멘토 역할도 함께 해주어 동기부여에 큰 도움이 됩니다.",
    ],
    price: "중학생 과외비는 보통 시간당 3만원~5만원 선이에요. 내신 대비나 특목고 준비의 경우 좀 더 높을 수 있지만, 이 범위를 크게 벗어나면 한 번 더 확인해 보세요.",
    duration: "중학생은 주 2~3회, 회당 90~120분 수업이 효과적이에요. 시험 기간에는 추가 수업을 고려하시는 것도 좋습니다.",
  },
  "고등": {
    char: [
      "고등학생은 내신과 수능을 동시에 준비해야 하는 가장 중요한 시기예요. 효율적인 시간 관리와 전략적인 학습이 필수적입니다.",
      "고등학생에게 과외는 단순한 수업이 아니라 입시 전략 파트너예요. 성적 분석, 취약점 보완, 시험 전략까지 종합적으로 관리받을 수 있습니다.",
    ],
    price: "고등학생 과외비는 보통 시간당 4만원~7만원 선이에요. 수능 대비나 논술 준비의 경우 전문 강사를 찾으시면 그 이상일 수도 있습니다.",
    duration: "고등학생은 주 2~4회, 회당 120분 이상 수업이 일반적이에요. 특히 시험 전에는 집중 수업을 통해 마무리하는 게 효과적입니다.",
  }
};

const REVIEW_TEMPLATES = [
  (loc, lvl, subj) => `저도 ${loc}에서 아이 ${subj} 과외를 시작한 지 4개월 정도 됐는데, 정말 만족하고 있어요. 처음에는 반신반의했는데, 아이 성적이 눈에 띄게 올랐거든요. 특히 선생님이 아이의 약점을 정확히 파악해서 맞춤 수업을 해주시는 게 좋았어요.`,
  (loc, lvl, subj) => `주변에 ${loc} 학부모님들한테 물어보니, ${subj} 과외 만족도가 꽤 높더라고요. 학원보다 시간 조절이 자유롭고, 아이 수준에 딱 맞는 수업이 가능하다는 게 가장 큰 장점이라고 하세요.`,
  (loc, lvl, subj) => `솔직히 과외비가 부담이 됐는데, 아이의 ${subj} 성적이 한 달 만에 15점이나 올랐어요. ${loc}에서 좋은 선생님 만나는 게 쉽지 않다고 들었는데, 저는 운이 좋았나 봐요.`,
  (loc, lvl, subj) => `${loc}에서 ${lvl} ${subj} 과외를 시작한 이유는 학원에서 성적이 안 올라서였어요. 1:1 수업으로 바꾸니까 아이가 모르는 부분을 바로바로 질문할 수 있어서 이해도가 확 높아졌어요.`,
  (loc, lvl, subj) => `과외 선생님이 매 수업 후에 카톡으로 수업 내용과 아이 상태를 알려주시는데, 이게 정말 좋아요. ${loc}에서 이렇게 꼼꼼한 선생님 찾기 쉽지 않거든요.`,
  (loc, lvl, subj) => `처음에 아이가 ${subj}를 정말 싫어했는데, 과외를 시작하고 나서 흥미가 생겼다고 하더라고요. 역시 선생님과의 궁합이 중요한 것 같아요. ${loc}에서 좋은 선생님 만나면 아이의 태도까지 달라져요.`,
  (loc, lvl, subj) => `${loc}에서 과외 선생님 세 분을 만나봤는데, 체험 수업을 해보니 차이가 크더라고요. 꼭 체험 수업을 먼저 해보시고 결정하세요. 아이와의 호흡이 맞아야 장기적으로 효과가 좋아요.`,
  (loc, lvl, subj) => `우리 아이가 ${lvl}학생인데, ${subj} 과외 시작한 후로 자신감이 많이 붙었어요. 성적도 물론 올랐지만, 무엇보다 공부에 대한 두려움이 줄어든 게 가장 큰 성과라고 생각해요.`,
  (loc, lvl, subj) => `${loc} 맘카페에서 추천받은 ${subj} 과외 선생님인데, 정말 소문대로 잘 가르치시더라고요. 아이 눈높이에 맞춰서 설명해 주시고, 숙제 양도 적절해서 아이가 부담 없이 다니고 있어요.`,
  (loc, lvl, subj) => `과외를 시작하기 전에 고민을 많이 했는데, 지금은 더 일찍 시작할 걸 그랬다는 생각이 들어요. ${loc}에서 ${subj} 과외를 고민하고 계신 분이 있다면, 일단 체험 수업부터 받아보시라고 말씀드리고 싶어요.`,
];

const CLOSING_TEMPLATES = [
  (loc, lvl, subj) => `${loc}에서 ${lvl} ${subj} 과외를 찾고 계신 분들께 이 글이 도움이 되었으면 좋겠습니다. 과외는 선생님과의 궁합이 가장 중요하니까, 여러 선생님을 만나보시고 우리 아이에게 딱 맞는 분을 찾으시길 바랍니다. 좋은 결과 있으시길 응원합니다!`,
  (loc, lvl, subj) => `여기까지 ${loc} ${lvl} ${subj} 과외에 대해 알아봤는데요. 궁금한 점이 있으시면 댓글로 남겨주세요. 아는 범위 내에서 성심껏 답변 드리겠습니다. 모든 학생들이 좋은 선생님을 만나 실력이 쑥쑥 오르길 바랍니다!`,
  (loc, lvl, subj) => `오늘 공유한 정보가 ${loc}에서 ${subj} 과외를 찾는 분들께 실질적인 도움이 되었으면 해요. 과외 선택은 신중하게, 하지만 너무 오래 고민하지 마시고 일단 체험 수업부터 시작해 보세요. 화이팅입니다!`,
  (loc, lvl, subj) => `${loc} 지역에서 ${lvl} ${subj} 과외를 준비하시는 모든 분들을 응원합니다. 아이의 교육에 관심을 가지고 이렇게 정보를 찾아보시는 것 자체가 정말 대단하신 거예요. 좋은 선생님과 함께 아이의 실력이 쑥쑥 올라가길 바랍니다.`,
  (loc, lvl, subj) => `지금까지 ${loc} ${lvl} ${subj} 과외에 대한 종합 가이드를 알려드렸어요. 이 글이 과외 선택에 도움이 되셨다면 주변 학부모님들에게도 공유해 주세요. 더 궁금한 점이 있으시면 언제든지 물어봐 주세요!`,
];

const EXTRA_PARAGRAPHS = [
  (loc, lvl, subj) => `참고로 ${loc} 지역의 과외 시장은 계절에 따라 변동이 있어요. 보통 방학 시즌에 과외 수요가 급증하기 때문에, 미리 선생님을 알아보시는 게 좋습니다. 개학 후에 급하게 찾으면 선택지가 줄어들 수 있어요.`,
  (loc, lvl, subj) => `과외를 시작할 때 계약서를 꼭 작성하세요. 수업 일정, 과외비, 환불 규정 등을 명확히 해두면 나중에 분쟁을 예방할 수 있어요. ${loc}에서도 이런 부분을 꼼꼼히 챙기시는 학부모님들이 많아지고 있습니다.`,
  (loc, lvl, subj) => `온라인 과외도 고려해 보세요. ${loc}에서 원하는 선생님을 찾기 어렵다면, 화상 수업으로 전국의 실력 있는 선생님과 연결될 수 있어요. 최근에는 태블릿과 전자 필기 도구가 발전해서 온라인 수업의 질도 많이 좋아졌습니다.`,
  (loc, lvl, subj) => `과외 효과를 높이려면 부모님의 역할도 중요해요. 수업 후에 아이와 오늘 배운 내용에 대해 간단히 대화해 보세요. 아이가 설명하려고 노력하는 과정에서 학습 효과가 배가 됩니다.`,
  (loc, lvl, subj) => `${loc} 지역에는 과외 중개 플랫폼을 통해 선생님을 찾는 분들도 많아요. 숨은고수, 김과외 같은 앱을 활용하면 프로필과 리뷰를 확인할 수 있어서 선택에 도움이 됩니다. 다만, 플랫폼 수수료가 있을 수 있으니 직접 구하는 것과 비교해 보세요.`,
  (loc, lvl, subj) => `${lvl}학생의 ${subj} 학습에서 가장 흔한 실수는 기초를 건너뛰고 어려운 문제만 풀려는 거예요. 과외 선생님과 함께 기초부터 차근차근 다지면 결국 더 빨리 실력이 늘어요. 급하게 생각하지 마시고 꾸준히 해주세요.`,
  (loc, lvl, subj) => `과외 수업 중에 아이가 질문을 잘 안 한다면, 선생님에게 미리 말씀해 두세요. 좋은 선생님은 아이가 질문할 수 있는 편안한 분위기를 만들어 주실 거예요. ${subj}는 특히 모르는 걸 넘어가면 안 되는 과목이거든요.`,
  (loc, lvl, subj) => `${loc}에서 과외를 하면서 학원도 병행하는 분들이 있는데, 비용과 시간을 고려해서 하나에 집중하는 게 효율적인 경우가 많아요. 과외의 장점은 1:1 맞춤 수업이므로, 학원에서 부족한 부분을 보충하는 방식으로 활용하시는 것도 좋습니다.`,
  (loc, lvl, subj) => `과외 선생님과의 첫 만남에서 꼭 확인하실 사항이 있어요. 수업 방식, 교재 선정 기준, 숙제량, 시험 대비 방법 등을 구체적으로 물어보세요. 명확한 답변을 하시는 선생님이라면 수업도 체계적으로 진행하실 확률이 높습니다.`,
  (loc, lvl, subj) => `마지막으로 한 가지 팁을 드리자면, 과외 선생님의 학력보다 교수법이 더 중요해요. 명문대 출신이라도 가르치는 스킬이 부족할 수 있고, 반대로 교육학을 전공한 선생님이 훨씬 효과적일 수 있거든요.`,
];

// --- 태그 생성 ---
function generateTags(location, level, subject, rng) {
  const baseTags = [
    `${location}${subject}과외`, `${location}${level}과외`, `${level}${subject}과외`,
    `${location}과외추천`, `${subject}과외비용`, `${level}${subject}`, `${location}학원`,
    `${subject}공부법`, `${location}교육`, `${level}과외추천`, `${subject}과외추천`,
    `${location}${level}${subject}`, `1대1${subject}과외`, `${location}개인과외`,
    `${subject}성적올리기`, `${level}학생과외`, `${location}과외비`,
  ];
  return pickN(baseTags, 10, rng);
}

// --- 썸네일 SVG 생성 ---
function generateThumbnail(location, level, subject) {
  const colors = {
    "국어": "#E74C3C", "영어": "#3498DB", "수학": "#2ECC71", "사회": "#F39C12",
    "과학": "#9B59B6", "코딩": "#1ABC9C", "검정고시": "#E67E22", "논술": "#34495E"
  };
  const color = colors[subject] || "#3498DB";
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:1"/>
        <stop offset="100%" style="stop-color:#2C3E50;stop-opacity:1"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <circle cx="1050" cy="120" r="80" fill="rgba(255,255,255,0.1)"/>
    <circle cx="150" cy="500" r="120" fill="rgba(255,255,255,0.05)"/>
    <rect x="80" y="80" width="1040" height="470" rx="20" fill="rgba(255,255,255,0.1)"/>
    <text x="600" y="240" font-family="sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle">${location}</text>
    <text x="600" y="340" font-family="sans-serif" font-size="56" fill="rgba(255,255,255,0.9)" text-anchor="middle">${level} ${subject} 과외</text>
    <line x1="450" y1="380" x2="750" y2="380" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
    <text x="600" y="440" font-family="sans-serif" font-size="32" fill="rgba(255,255,255,0.7)" text-anchor="middle">맞춤 교육 · 성적 향상 · 1:1 수업</text>
    <text x="600" y="510" font-family="sans-serif" font-size="28" fill="rgba(255,255,255,0.5)" text-anchor="middle">anhani.com</text>
  </svg>`;
}

// --- 콘텐츠 생성 ---
function generateContent(location, level, subject, parentRegion) {
  const seed = hashCode(`${location}-${level}-${subject}`);
  const rng = seededRandom(seed);
  
  const subj = SUBJECT_CONTENT[subject];
  const lvl = LEVEL_CONTENT[level];
  
  const opening = pick(OPENINGS, rng)(location, level, subject);
  const why = pick(subj.why, rng);
  const tip = pick(subj.tip, rng);
  const method = pick(subj.method, rng);
  const levelChar = pick(lvl.char, rng);
  const review1 = pick(REVIEW_TEMPLATES, rng)(location, level, subject);
  const review2 = pick(REVIEW_TEMPLATES.filter(t => t !== REVIEW_TEMPLATES[Math.floor(rng() * REVIEW_TEMPLATES.length)]), rng)(location, level, subject);
  const extra1 = pick(EXTRA_PARAGRAPHS, rng)(location, level, subject);
  const extra2 = pick(EXTRA_PARAGRAPHS.filter((_, i) => i !== Math.floor(rng() * EXTRA_PARAGRAPHS.length)), rng)(location, level, subject);
  const closing = pick(CLOSING_TEMPLATES, rng)(location, level, subject);
  const tags = generateTags(location, level, subject, rng);

  const regionDisplay = parentRegion ? `${parentRegion} ${location}` : location;

  const title = `${regionDisplay} ${level} ${subject} 과외 추천 - 비용, 선생님 선택 가이드`;
  const description = `${regionDisplay} ${level}학생 ${subject} 과외 정보를 찾고 계신가요? 과외비, 좋은 선생님 고르는 법, 실제 후기까지 한 번에 정리했습니다.`;

  const bodyHTML = `
    <article>
      <p>${opening}</p>
      
      <h2>${regionDisplay}에서 ${level} ${subject} 과외가 필요한 이유</h2>
      <p>${why}</p>
      <p>${levelChar}</p>
      
      <h2>${subject} 과외 선생님 고르는 핵심 팁</h2>
      <p>${tip}</p>
      <p>${extra1}</p>
      
      <h2>효과적인 ${subject} 과외 학습 방법</h2>
      <p>${method}</p>
      
      <h2>${regionDisplay} ${level} ${subject} 과외비 안내</h2>
      <p>${lvl.price}</p>
      <p>${lvl.duration}</p>
      
      <h2>실제 ${regionDisplay} ${subject} 과외 후기</h2>
      <p>${review1}</p>
      <p>${review2}</p>
      
      <h2>과외 시작 전 꼭 알아두세요</h2>
      <p>${extra2}</p>
      
      <p>${closing}</p>
    </article>
  `;

  return { title, description, bodyHTML, tags };
}

// --- HTML 페이지 렌더링 ---
function renderPage(location, level, subject, parentRegion, url) {
  const { title, description, bodyHTML, tags } = generateContent(location, level, subject, parentRegion);
  const thumbnail = generateThumbnail(location, level, subject);
  const thumbnailDataUri = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(thumbnail)))}`;
  const regionDisplay = parentRegion ? `${parentRegion} ${location}` : location;
  const canonical = `https://anhani.com${url}`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | 안하니</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical}">
  
  <!-- 네이버 SEO -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${thumbnailDataUri}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="안하니">
  <meta property="og:locale" content="ko_KR">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title}",
    "description": "${description}",
    "author": { "@type": "Organization", "name": "안하니" },
    "publisher": { "@type": "Organization", "name": "안하니", "url": "https://anhani.com" },
    "mainEntityOfPage": "${canonical}"
  }
  </script>
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.8; color: #333; background: #f9fafb; }
    .header { background: #fff; border-bottom: 1px solid #e5e7eb; padding: 16px 0; }
    .header-inner { max-width: 768px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; }
    .logo { font-size: 24px; font-weight: 800; color: #111; text-decoration: none; }
    .nav a { color: #666; text-decoration: none; margin-left: 20px; font-size: 14px; }
    .container { max-width: 768px; margin: 0 auto; padding: 32px 20px; }
    .breadcrumb { font-size: 13px; color: #888; margin-bottom: 16px; }
    .breadcrumb a { color: #888; text-decoration: none; }
    .breadcrumb a:hover { color: #333; }
    .thumbnail { width: 100%; border-radius: 12px; margin-bottom: 24px; }
    h1 { font-size: 28px; font-weight: 800; color: #111; margin-bottom: 12px; line-height: 1.4; }
    .meta { font-size: 13px; color: #999; margin-bottom: 32px; }
    article h2 { font-size: 22px; font-weight: 700; color: #111; margin: 36px 0 16px; padding-left: 12px; border-left: 4px solid #3b82f6; }
    article p { font-size: 16px; margin-bottom: 16px; word-break: keep-all; }
    .tags { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
    .tags h3 { font-size: 14px; color: #666; margin-bottom: 12px; }
    .tag { display: inline-block; background: #f3f4f6; color: #555; padding: 6px 14px; border-radius: 20px; font-size: 13px; margin: 0 6px 8px 0; text-decoration: none; }
    .tag:hover { background: #e5e7eb; }
    .footer { background: #111; color: #999; padding: 40px 20px; margin-top: 60px; text-align: center; font-size: 13px; }
    .footer a { color: #ccc; text-decoration: none; }
    @media (max-width: 640px) { h1 { font-size: 22px; } article h2 { font-size: 18px; } }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-inner">
      <a href="/" class="logo">안하니</a>
      <nav class="nav">
        <a href="/">홈</a>
      </nav>
    </div>
  </header>
  
  <main class="container">
    <div class="breadcrumb">
      <a href="/">홈</a> &gt; <a href="/#${encodeURIComponent(parentRegion || location)}">${parentRegion || location}</a> &gt; ${regionDisplay} ${level} ${subject} 과외
    </div>
    
    <img src="${thumbnailDataUri}" alt="${regionDisplay} ${level} ${subject} 과외" class="thumbnail" width="1200" height="630">
    
    <h1>${regionDisplay} ${level} ${subject} 과외 추천 가이드</h1>
    <div class="meta">최종 업데이트: 2026년 4월 | 작성자: 안하니 교육팀</div>
    
    ${bodyHTML}
    
    <div class="tags">
      <h3>관련 태그</h3>
      ${tags.map(t => `<a href="/#" class="tag">#${t}</a>`).join('\n      ')}
    </div>
  </main>
  
  <footer class="footer">
    <p>&copy; 2026 <a href="https://anhani.com">안하니</a> | 대한민국 교육 정보 플랫폼</p>
  </footer>
</body>
</html>`;
}

// --- URL 파싱 ---
function parseUrl(pathname) {
  // URL 형식: /지역-학교급-과목-과외
  const decoded = decodeURIComponent(pathname.replace(/^\//, ''));
  if (!decoded) return null;
  
  const parts = decoded.split('-');
  if (parts.length < 4) return null;
  
  const suffix = parts[parts.length - 1]; // "과외"
  if (suffix !== '과외') return null;
  
  const subject = parts[parts.length - 2];
  const level = parts[parts.length - 3];
  const location = parts.slice(0, parts.length - 3).join('-');
  
  if (!SUBJECTS.includes(subject)) return null;
  if (!LEVELS.includes(level)) return null;
  
  return { location, level, subject };
}

// --- 지역 유효성 검증 & 상위 지역 찾기 ---
function findRegion(location) {
  // 시/군/구 찾기
  for (const [parent, districts] of Object.entries(REGIONS)) {
    if (districts.includes(location)) {
      return { valid: true, parentRegion: parent };
    }
  }
  // 읍/면 찾기
  for (const [parent, areas] of Object.entries(EUP_MYEON)) {
    if (areas.includes(location)) {
      // 상위 군 찾기
      for (const [grandParent, districts] of Object.entries(REGIONS)) {
        if (districts.includes(parent)) {
          return { valid: true, parentRegion: `${grandParent} ${parent}` };
        }
      }
      return { valid: true, parentRegion: parent };
    }
  }
  // 광역시/도 자체
  if (REGIONS[location]) {
    return { valid: true, parentRegion: null };
  }
  return { valid: false };
}

// --- 모든 URL 목록 생성 (sitemap용) ---
function getAllUrls() {
  const urls = [];
  
  // 시/군/구
  for (const [parent, districts] of Object.entries(REGIONS)) {
    for (const district of districts) {
      for (const level of LEVELS) {
        for (const subject of SUBJECTS) {
          urls.push(`/${encodeURIComponent(`${district}-${level}-${subject}-과외`)}`);
        }
      }
    }
  }
  
  // 읍/면
  for (const [parent, areas] of Object.entries(EUP_MYEON)) {
    for (const area of areas) {
      for (const level of LEVELS) {
        for (const subject of SUBJECTS) {
          urls.push(`/${encodeURIComponent(`${area}-${level}-${subject}-과외`)}`);
        }
      }
    }
  }
  
  return urls;
}

// --- 사이트맵 생성 ---
function generateSitemap() {
  const urls = getAllUrls();
  const baseUrl = 'https://anhani.com';
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;
  
  for (const url of urls) {
    xml += `  <url>
    <loc>${baseUrl}${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }
  
  xml += `</urlset>`;
  return xml;
}

// --- 사이트맵 인덱스 (큰 사이트맵 분할) ---
function generateSitemapIndex(totalUrls) {
  const URLS_PER_SITEMAP = 10000;
  const numSitemaps = Math.ceil(totalUrls / URLS_PER_SITEMAP);
  const baseUrl = 'https://anhani.com';
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  for (let i = 0; i < numSitemaps; i++) {
    xml += `  <sitemap>
    <loc>${baseUrl}/sitemap-${i}.xml</loc>
  </sitemap>
`;
  }
  xml += `</sitemapindex>`;
  return xml;
}

function generateSitemapPart(part) {
  const URLS_PER_SITEMAP = 10000;
  const allUrls = getAllUrls();
  const start = part * URLS_PER_SITEMAP;
  const end = Math.min(start + URLS_PER_SITEMAP, allUrls.length);
  const urls = allUrls.slice(start, end);
  const baseUrl = 'https://anhani.com';
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  for (const url of urls) {
    xml += `  <url>
    <loc>${baseUrl}${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }
  xml += `</urlset>`;
  return xml;
}

// --- 공통 레이아웃 ---
function commonHead(title, description, canonical) {
  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="안하니">
  <meta property="og:locale" content="ko_KR">
  <link rel="canonical" href="${canonical}">`;
}

function commonStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans KR', -apple-system, sans-serif; background: #f8fafc; color: #334155; line-height: 1.7; }
    
    /* 네비게이션 */
    .nav { background: #fff; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 100; }
    .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; height: 64px; }
    .nav-logo { font-size: 22px; font-weight: 900; color: #0f172a; text-decoration: none; letter-spacing: -1px; }
    .nav-logo span { color: #6366f1; }
    .nav-links { display: flex; gap: 0; align-items: center; height: 100%; }
    .nav-item { position: relative; height: 100%; display: flex; align-items: center; }
    .nav-item > a { color: #475569; text-decoration: none; font-size: 15px; font-weight: 500; padding: 8px 14px; border-radius: 8px; transition: all 0.2s; display: flex; align-items: center; gap: 4px; }
    .nav-item > a:hover { background: #f1f5f9; color: #6366f1; }
    .nav-item > a.active { color: #6366f1; background: #eef2ff; }
    .nav-item > a .arrow-down { font-size: 10px; opacity: 0.5; }
    .dropdown { display: none; position: absolute; top: 100%; left: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 0; min-width: 180px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
    .nav-item:hover .dropdown { display: block; }
    .dropdown a { display: block; padding: 8px 20px; color: #475569; text-decoration: none; font-size: 14px; transition: all 0.15s; }
    .dropdown a:hover { background: #f1f5f9; color: #6366f1; }
    .dropdown .divider { height: 1px; background: #e2e8f0; margin: 4px 0; }
    .nav-cta { background: #6366f1; color: #fff !important; border-radius: 8px !important; padding: 8px 20px !important; margin-left: 8px; }
    .nav-cta:hover { background: #4f46e5 !important; }
    .mobile-menu { display: none; background: none; border: none; font-size: 24px; cursor: pointer; }
    
    /* 푸터 */
    .footer { background: #0f172a; color: #94a3b8; padding: 60px 24px 40px; }
    .footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1.5fr repeat(3, 1fr); gap: 40px; }
    .footer-brand h3 { color: #fff; font-size: 20px; margin-bottom: 12px; }
    .footer-brand p { font-size: 13px; line-height: 1.8; }
    .footer-col h4 { color: #e2e8f0; font-size: 14px; margin-bottom: 16px; font-weight: 600; }
    .footer-col a { display: block; color: #94a3b8; text-decoration: none; font-size: 13px; margin-bottom: 8px; transition: color 0.2s; }
    .footer-col a:hover { color: #fff; }
    .footer-bottom { max-width: 1200px; margin: 40px auto 0; padding-top: 24px; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b; }
    
    @media (max-width: 768px) {
      .nav-links { display: none; }
      .mobile-menu { display: block; }
      .footer-inner { grid-template-columns: 1fr 1fr; gap: 24px; }
    }
  `;
}

function navHTML(activePage) {
  return `<nav class="nav">
    <div class="nav-inner">
      <a href="/" class="nav-logo">안<span>하니</span></a>
      <div class="nav-links">
        
        <div class="nav-item">
          <a href="/지역별" class="${activePage === 'region' ? 'active' : ''}">전국과외 <span class="arrow-down">▼</span></a>
          <div class="dropdown">
            <a href="/지역별">지역별 과외</a>
            <a href="/학교급별">학년별 과외</a>
            <a href="/학교급별">학교별 과외</a>
          </div>
        </div>
        
        <div class="nav-item">
          <a href="/과목별" class="${activePage === 'subject' ? 'active' : ''}">과목별 <span class="arrow-down">▼</span></a>
          <div class="dropdown">
            <a href="/과목별/국어">국어</a>
            <a href="/과목별/영어">영어</a>
            <a href="/과목별/수학">수학</a>
            <a href="/과목별/사회">사회</a>
            <a href="/과목별/과학">과학</a>
            <a href="/과목별/코딩">코딩</a>
            <a href="/과목별/검정고시">검정고시</a>
          </div>
        </div>
        
        <div class="nav-item">
          <a href="/학원" class="${activePage === 'academy' ? 'active' : ''}">학원 <span class="arrow-down">▼</span></a>
          <div class="dropdown">
            <a href="/학원/전국지점">전국 지점 찾기</a>
          </div>
        </div>
        
        <div class="nav-item">
          <a href="/학습가이드" class="${activePage === 'guide' ? 'active' : ''}">학습가이드</a>
        </div>
        
        <div class="nav-item">
          <a href="/유학" class="${activePage === 'abroad' ? 'active' : ''}">유학</a>
        </div>
        
        <div class="nav-item">
          <a href="/외국어" class="${activePage === 'foreign' ? 'active' : ''}">외국어 <span class="arrow-down">▼</span></a>
          <div class="dropdown">
            <a href="/외국어/영어">영어</a>
            <a href="/외국어/중국어">중국어</a>
            <a href="/외국어/일본어">일본어</a>
          </div>
        </div>
        
        <a href="/상담" class="nav-cta">무료 상담</a>
      </div>
      <button class="mobile-menu" onclick="document.querySelector('.nav-links').style.display=document.querySelector('.nav-links').style.display==='flex'?'none':'flex'">☰</button>
    </div>
  </nav>`;
}

function footerHTML() {
  const regionCols = Object.keys(REGIONS).slice(0, 8);
  return `<footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <h3>안하니</h3>
        <p>전국 시/군/구/읍/면 과외 정보를<br>한 곳에서 확인하세요.<br>초등·중등·고등 맞춤 과외 매칭</p>
      </div>
      <div class="footer-col">
        <h4>과목별 학습</h4>
        ${SUBJECTS.map(s => `<a href="/과목별/${encodeURIComponent(s)}">${s} 과외</a>`).join('')}
      </div>
      <div class="footer-col">
        <h4>지역별 과외</h4>
        ${regionCols.map(r => `<a href="/지역별/${encodeURIComponent(r)}">${r}</a>`).join('')}
      </div>
      <div class="footer-col">
        <h4>학교급별</h4>
        ${LEVELS.map(l => `<a href="/학교급별/${encodeURIComponent(l)}">${l} 과외</a>`).join('')}
        <a href="/과목별/${encodeURIComponent('검정고시')}">검정고시</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 안하니 | 대한민국 과외 정보 플랫폼. All rights reserved.</p>
    </div>
  </footer>`;
}

// --- 홈페이지 ---
function renderHomepage() {
  // 총 페이지 수 계산
  let totalLocations = 0;
  for (const districts of Object.values(REGIONS)) totalLocations += districts.length;
  for (const areas of Object.values(EUP_MYEON)) totalLocations += areas.length;
  const totalPages = totalLocations * LEVELS.length * SUBJECTS.length;

  const regionCards = Object.entries(REGIONS).map(([parent, districts]) => {
    return `<a href="/지역별/${encodeURIComponent(parent)}" class="region-card">
      <div class="region-icon">${parent.charAt(0)}</div>
      <div class="region-info">
        <h3>${parent}</h3>
        <p>${districts.length}개 시/군/구</p>
      </div>
      <span class="arrow">→</span>
    </a>`;
  }).join('');

  const subjectColors = {
    "국어": "#ef4444", "영어": "#3b82f6", "수학": "#22c55e", "사회": "#f59e0b",
    "과학": "#a855f7", "코딩": "#06b6d4", "검정고시": "#f97316", "논술": "#64748b"
  };
  const subjectIcons = {
    "국어": "📖", "영어": "🌍", "수학": "📐", "사회": "🏛️",
    "과학": "🔬", "코딩": "💻", "검정고시": "📝", "논술": "✍️"
  };
  const subjectCards = SUBJECTS.map(s => {
    return `<a href="/과목별/${encodeURIComponent(s)}" class="subject-card" style="--accent:${subjectColors[s]}">
      <span class="subject-icon">${subjectIcons[s]}</span>
      <h3>${s}</h3>
      <p>${s} 과외 정보 보기</p>
    </a>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  ${commonHead('안하니 - 전국 과외 정보 플랫폼', '전국 시/군/구/읍/면 초등, 중등, 고등 과외 정보! 국어, 영어, 수학, 사회, 과학, 코딩, 검정고시, 논술 과외를 찾아보세요.', 'https://anhani.com/')}
  <style>
    ${commonStyles()}
    
    .hero { background: linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #6366f1 100%); color: #fff; padding: 80px 24px 100px; text-align: center; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 50%); }
    .hero-content { position: relative; max-width: 700px; margin: 0 auto; }
    .hero-badge { display: inline-block; background: rgba(255,255,255,0.15); backdrop-filter: blur(4px); padding: 6px 20px; border-radius: 20px; font-size: 14px; font-weight: 500; margin-bottom: 24px; }
    .hero h1 { font-size: 44px; font-weight: 900; line-height: 1.3; margin-bottom: 16px; letter-spacing: -1px; }
    .hero h1 em { font-style: normal; color: #c7d2fe; }
    .hero p { font-size: 18px; opacity: 0.85; margin-bottom: 36px; line-height: 1.7; }
    .hero-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .hero-btn { padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 600; text-decoration: none; transition: all 0.2s; }
    .hero-btn-primary { background: #fff; color: #4f46e5; }
    .hero-btn-primary:hover { background: #eef2ff; transform: translateY(-2px); }
    .hero-btn-secondary { background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3); }
    .hero-btn-secondary:hover { background: rgba(255,255,255,0.25); }
    
    .stats { max-width: 1200px; margin: -50px auto 0; padding: 0 24px; position: relative; z-index: 10; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .stat-item { background: #fff; padding: 32px 20px; text-align: center; }
    .stat-number { font-size: 36px; font-weight: 900; color: #6366f1; margin-bottom: 4px; }
    .stat-label { font-size: 14px; color: #64748b; }
    
    .section { max-width: 1200px; margin: 0 auto; padding: 80px 24px; }
    .section-header { text-align: center; margin-bottom: 48px; }
    .section-label { font-size: 13px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
    .section-title { font-size: 32px; font-weight: 800; color: #0f172a; line-height: 1.4; }
    .section-title em { font-style: normal; color: #6366f1; }
    
    .regions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
    .region-card { display: flex; align-items: center; gap: 14px; background: #fff; padding: 16px 20px; border-radius: 12px; text-decoration: none; color: inherit; border: 1px solid #e2e8f0; transition: all 0.2s; }
    .region-card:hover { border-color: #6366f1; box-shadow: 0 4px 16px rgba(99,102,241,0.12); transform: translateY(-2px); }
    .region-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #eef2ff, #e0e7ff); color: #6366f1; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; flex-shrink: 0; }
    .region-info h3 { font-size: 16px; font-weight: 700; color: #0f172a; }
    .region-info p { font-size: 12px; color: #94a3b8; }
    .arrow { margin-left: auto; color: #cbd5e1; font-size: 18px; }
    .region-card:hover .arrow { color: #6366f1; }
    
    .subjects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .subject-card { background: #fff; border-radius: 16px; padding: 28px 24px; text-decoration: none; color: inherit; border: 1px solid #e2e8f0; transition: all 0.2s; text-align: center; }
    .subject-card:hover { border-color: var(--accent); box-shadow: 0 8px 24px rgba(0,0,0,0.06); transform: translateY(-4px); }
    .subject-icon { font-size: 40px; margin-bottom: 12px; display: block; }
    .subject-card h3 { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
    .subject-card p { font-size: 14px; color: #94a3b8; }
    .subject-card:hover h3 { color: var(--accent); }
    
    .levels-row { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
    .level-card { flex: 1; min-width: 280px; max-width: 380px; background: #fff; border-radius: 16px; padding: 36px 28px; text-align: center; border: 1px solid #e2e8f0; transition: all 0.2s; text-decoration: none; color: inherit; }
    .level-card:hover { border-color: #6366f1; box-shadow: 0 8px 24px rgba(99,102,241,0.1); transform: translateY(-4px); }
    .level-emoji { font-size: 48px; margin-bottom: 16px; display: block; }
    .level-card h3 { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
    .level-card p { font-size: 14px; color: #64748b; line-height: 1.6; }
    
    .cta-section { background: linear-gradient(135deg, #312e81, #4f46e5); border-radius: 24px; padding: 60px 40px; text-align: center; color: #fff; margin: 0 auto; max-width: 900px; }
    .cta-section h2 { font-size: 28px; font-weight: 800; margin-bottom: 12px; }
    .cta-section p { font-size: 16px; opacity: 0.8; margin-bottom: 28px; }
    .cta-btn { display: inline-block; background: #fff; color: #4f46e5; padding: 14px 36px; border-radius: 12px; font-size: 16px; font-weight: 700; text-decoration: none; transition: all 0.2s; }
    .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
    
    @media (max-width: 768px) {
      .hero h1 { font-size: 28px; }
      .hero { padding: 60px 20px 80px; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .stat-number { font-size: 28px; }
      .section-title { font-size: 24px; }
      .section { padding: 60px 20px; }
    }
  </style>
</head>
<body>
  ${navHTML('')}
  
  <section class="hero">
    <div class="hero-content">
      <div class="hero-badge">🎓 전국 ${totalLocations.toLocaleString()}개 지역 과외 정보</div>
      <h1>우리 아이에게 딱 맞는<br><em>과외 선생님</em>을 찾아보세요</h1>
      <p>전국 시/군/구/읍/면 초등·중등·고등<br>국어, 영어, 수학 등 8개 과목 과외 정보를 한 곳에서</p>
      <div class="hero-buttons">
        <a href="/지역별" class="hero-btn hero-btn-primary">지역별 과외 찾기</a>
        <a href="/과목별" class="hero-btn hero-btn-secondary">과목별 보기</a>
      </div>
    </div>
  </section>
  
  <div class="stats">
    <div class="stats-grid">
      <div class="stat-item"><div class="stat-number">${totalLocations.toLocaleString()}+</div><div class="stat-label">전국 과외 지역</div></div>
      <div class="stat-item"><div class="stat-number">${totalPages.toLocaleString()}+</div><div class="stat-label">맞춤 과외 정보</div></div>
      <div class="stat-item"><div class="stat-number">8</div><div class="stat-label">전문 과목</div></div>
      <div class="stat-item"><div class="stat-number">100%</div><div class="stat-label">무료 정보 제공</div></div>
    </div>
  </div>
  
  <section class="section">
    <div class="section-header">
      <div class="section-label">지역별 과외</div>
      <h2 class="section-title">우리 동네 <em>과외 정보</em> 바로 확인</h2>
    </div>
    <div class="regions-grid">${regionCards}</div>
  </section>
  
  <section class="section" style="padding-top:0">
    <div class="section-header">
      <div class="section-label">과목별</div>
      <h2 class="section-title">과목에 맞는 <em>맞춤 과외</em>를 선택하세요</h2>
    </div>
    <div class="subjects-grid">${subjectCards}</div>
  </section>
  
  <section class="section" style="padding-top:0">
    <div class="section-header">
      <div class="section-label">학교급별</div>
      <h2 class="section-title">학교급에 맞는 <em>전문 과외</em></h2>
    </div>
    <div class="levels-row">
      <a href="/학교급별/초등" class="level-card">
        <span class="level-emoji">🌱</span>
        <h3>초등 과외</h3>
        <p>학습 습관 형성과 기초 실력을<br>탄탄하게 다지는 시기</p>
      </a>
      <a href="/학교급별/중등" class="level-card">
        <span class="level-emoji">📚</span>
        <h3>중등 과외</h3>
        <p>내신 대비와 고등 진학을 위한<br>체계적 학습 전략</p>
      </a>
      <a href="/학교급별/고등" class="level-card">
        <span class="level-emoji">🎯</span>
        <h3>고등 과외</h3>
        <p>수능과 내신을 동시에 잡는<br>입시 맞춤 전략</p>
      </a>
    </div>
  </section>
  
  <section class="section" style="padding-top:0">
    <div class="cta-section">
      <h2>지금 바로 우리 동네 과외를 찾아보세요</h2>
      <p>전국 ${totalLocations.toLocaleString()}개 지역, ${totalPages.toLocaleString()}개 맞춤 과외 정보가 준비되어 있습니다</p>
      <a href="/지역별" class="cta-btn">과외 찾기 시작 →</a>
    </div>
  </section>
  
  ${footerHTML()}
</body>
</html>`;
}

// --- 카테고리: 지역별 ---
function renderRegionList() {
  const cards = Object.entries(REGIONS).map(([parent, districts]) => {
    const distLinks = districts.map(d => 
      `<a href="/지역별/${encodeURIComponent(parent)}/${encodeURIComponent(d)}" class="dist-chip">${d}</a>`
    ).join('');
    return `<div class="cat-card"><h3><a href="/지역별/${encodeURIComponent(parent)}">${parent}</a></h3><div class="chips">${distLinks}</div></div>`;
  }).join('');

  return `<!DOCTYPE html><html lang="ko"><head>
  ${commonHead('지역별 과외 - 안하니', '전국 시/군/구/읍/면 과외 정보를 지역별로 확인하세요.', 'https://anhani.com/지역별')}
  <style>${commonStyles()}
    .page-hero { background: linear-gradient(135deg, #312e81, #4f46e5); color: #fff; padding: 48px 24px; text-align: center; }
    .page-hero h1 { font-size: 32px; font-weight: 800; }
    .page-hero p { opacity: 0.8; margin-top: 8px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
    .cat-card { background: #fff; border-radius: 12px; padding: 24px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
    .cat-card h3 { font-size: 20px; font-weight: 700; margin-bottom: 12px; }
    .cat-card h3 a { color: #0f172a; text-decoration: none; }
    .cat-card h3 a:hover { color: #6366f1; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .dist-chip { padding: 6px 14px; background: #f1f5f9; border-radius: 8px; color: #475569; text-decoration: none; font-size: 14px; transition: all 0.2s; }
    .dist-chip:hover { background: #eef2ff; color: #6366f1; }
  </style></head><body>
  ${navHTML('region')}
  <div class="page-hero"><h1>지역별 과외</h1><p>전국 시/군/구/읍/면 과외 정보를 한눈에</p></div>
  <div class="container">${cards}</div>
  ${footerHTML()}
  </body></html>`;
}

// --- 카테고리: 특정 지역 ---
function renderRegionDetail(region) {
  const districts = REGIONS[region];
  if (!districts) return null;
  
  const cards = districts.map(d => {
    const links = SUBJECTS.map(s => 
      `<a href="/${encodeURIComponent(`${d}-초등-${s}-과외`)}" class="subj-link">${s}</a>`
    ).join('');
    return `<div class="cat-card"><h3>${d}</h3>
      <div class="level-tabs">
        ${LEVELS.map(l => `<span class="level-tab" onclick="this.parentElement.parentElement.querySelectorAll('.subj-link').forEach(a=>{const h=a.href;a.href=h.replace(/초등|중등|고등/,'${l}')})">${l}</span>`).join('')}
      </div>
      <div class="chips">${links}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html><html lang="ko"><head>
  ${commonHead('${region} 과외 - 안하니', '${region} 지역 초등·중등·고등 과외 정보를 확인하세요.', 'https://anhani.com/지역별/${encodeURIComponent(region)}')}
  <style>${commonStyles()}
    .page-hero { background: linear-gradient(135deg, #312e81, #4f46e5); color: #fff; padding: 48px 24px; text-align: center; }
    .page-hero h1 { font-size: 32px; font-weight: 800; }
    .page-hero p { opacity: 0.8; margin-top: 8px; }
    .breadcrumb { max-width: 1200px; margin: 0 auto; padding: 16px 24px; font-size: 14px; color: #94a3b8; }
    .breadcrumb a { color: #6366f1; text-decoration: none; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px 24px 60px; }
    .cat-card { background: #fff; border-radius: 12px; padding: 24px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
    .cat-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .subj-link { padding: 6px 14px; background: #f1f5f9; border-radius: 8px; color: #475569; text-decoration: none; font-size: 14px; transition: all 0.2s; }
    .subj-link:hover { background: #eef2ff; color: #6366f1; }
    .level-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
    .level-tab { padding: 4px 12px; background: #e2e8f0; border-radius: 6px; font-size: 13px; cursor: pointer; transition: all 0.2s; }
    .level-tab:hover { background: #6366f1; color: #fff; }
  </style></head><body>
  ${navHTML('region')}
  <div class="page-hero"><h1>${region} 과외</h1><p>${region} 지역 ${districts.length}개 시/군/구 과외 정보</p></div>
  <div class="breadcrumb"><a href="/">홈</a> &gt; <a href="/지역별">지역별</a> &gt; ${region}</div>
  <div class="container">${cards}</div>
  ${footerHTML()}
  </body></html>`;
}

// --- 카테고리: 과목별 ---
function renderSubjectList() {
  const subjectColors = {
    "국어": "#ef4444", "영어": "#3b82f6", "수학": "#22c55e", "사회": "#f59e0b",
    "과학": "#a855f7", "코딩": "#06b6d4", "검정고시": "#f97316", "논술": "#64748b"
  };
  const subjectIcons = {
    "국어": "📖", "영어": "🌍", "수학": "📐", "사회": "🏛️",
    "과학": "🔬", "코딩": "💻", "검정고시": "📝", "논술": "✍️"
  };
  
  const cards = SUBJECTS.map(s => {
    const regionLinks = Object.keys(REGIONS).map(r => 
      `<a href="/지역별/${encodeURIComponent(r)}" class="region-chip">${r}</a>`
    ).join('');
    return `<div class="subj-card" style="--accent:${subjectColors[s]}">
      <div class="subj-header"><span class="subj-icon">${subjectIcons[s]}</span><h3>${s} 과외</h3></div>
      <p>${SUBJECT_CONTENT[s].why[0].substring(0, 80)}...</p>
      <div class="chips">${regionLinks}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html><html lang="ko"><head>
  ${commonHead('과목별 과외 - 안하니', '국어, 영어, 수학, 사회, 과학, 코딩, 검정고시, 논술 과외 정보를 확인하세요.', 'https://anhani.com/과목별')}
  <style>${commonStyles()}
    .page-hero { background: linear-gradient(135deg, #312e81, #4f46e5); color: #fff; padding: 48px 24px; text-align: center; }
    .page-hero h1 { font-size: 32px; font-weight: 800; }
    .page-hero p { opacity: 0.8; margin-top: 8px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
    .subj-card { background: #fff; border-radius: 16px; padding: 28px; margin-bottom: 20px; border: 1px solid #e2e8f0; border-top: 4px solid var(--accent); }
    .subj-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .subj-icon { font-size: 32px; }
    .subj-card h3 { font-size: 22px; font-weight: 700; }
    .subj-card > p { color: #64748b; font-size: 14px; margin-bottom: 16px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .region-chip { padding: 6px 14px; background: #f1f5f9; border-radius: 8px; color: #475569; text-decoration: none; font-size: 13px; transition: all 0.2s; }
    .region-chip:hover { background: #eef2ff; color: #6366f1; }
  </style></head><body>
  ${navHTML('subject')}
  <div class="page-hero"><h1>과목별 과외</h1><p>8개 전문 과목별 과외 정보</p></div>
  <div class="container">${cards}</div>
  ${footerHTML()}
  </body></html>`;
}

// --- 카테고리: 학교급별 ---
function renderLevelList() {
  const levelData = {
    "초등": { emoji: "🌱", desc: "학습 습관 형성과 기초 실력을 탄탄하게 다지는 시기입니다. 재미있게 배우면서 자신감을 키워주세요." },
    "중등": { emoji: "📚", desc: "내신 대비와 고등 진학을 위한 체계적 학습 전략이 필요한 시기입니다." },
    "고등": { emoji: "🎯", desc: "수능과 내신을 동시에 잡는 입시 맞춤 전략으로 목표 대학에 한 걸음 더 다가가세요." }
  };

  const cards = LEVELS.map(l => {
    const d = levelData[l];
    const subjLinks = SUBJECTS.map(s => 
      `<a href="/학교급별/${encodeURIComponent(l)}/${encodeURIComponent(s)}" class="subj-link">${s}</a>`
    ).join('');
    return `<div class="level-card-lg">
      <span class="lv-emoji">${d.emoji}</span>
      <h3>${l} 과외</h3>
      <p>${d.desc}</p>
      <div class="chips">${subjLinks}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html><html lang="ko"><head>
  ${commonHead('학교급별 과외 - 안하니', '초등, 중등, 고등 학교급에 맞는 과외 정보를 확인하세요.', 'https://anhani.com/학교급별')}
  <style>${commonStyles()}
    .page-hero { background: linear-gradient(135deg, #312e81, #4f46e5); color: #fff; padding: 48px 24px; text-align: center; }
    .page-hero h1 { font-size: 32px; font-weight: 800; }
    .page-hero p { opacity: 0.8; margin-top: 8px; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 24px; }
    .level-card-lg { background: #fff; border-radius: 16px; padding: 36px; margin-bottom: 20px; border: 1px solid #e2e8f0; text-align: center; }
    .lv-emoji { font-size: 48px; display: block; margin-bottom: 12px; }
    .level-card-lg h3 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .level-card-lg > p { color: #64748b; font-size: 15px; margin-bottom: 20px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
    .subj-link { padding: 8px 18px; background: #f1f5f9; border-radius: 8px; color: #475569; text-decoration: none; font-size: 14px; transition: all 0.2s; }
    .subj-link:hover { background: #eef2ff; color: #6366f1; }
  </style></head><body>
  ${navHTML('level')}
  <div class="page-hero"><h1>학교급별 과외</h1><p>초등·중등·고등 맞춤 과외 정보</p></div>
  <div class="container">${cards}</div>
  ${footerHTML()}
  </body></html>`;
}

// --- robots.txt ---
function robotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: https://anhani.com/sitemap.xml`;
}

// --- Worker 메인 ---
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // robots.txt
    if (pathname === '/robots.txt') {
      return new Response(robotsTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    
    // 사이트맵
    if (pathname === '/sitemap.xml') {
      const allUrls = getAllUrls();
      if (allUrls.length > 10000) {
        return new Response(generateSitemapIndex(allUrls.length), {
          headers: { 'Content-Type': 'application/xml; charset=utf-8' }
        });
      }
      return new Response(generateSitemap(), {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      });
    }
    
    // 분할 사이트맵
    const sitemapMatch = pathname.match(/^\/sitemap-(\d+)\.xml$/);
    if (sitemapMatch) {
      const part = parseInt(sitemapMatch[1]);
      return new Response(generateSitemapPart(part), {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      });
    }
    
    // 홈페이지
    if (pathname === '/' || pathname === '') {
      return new Response(renderHomepage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    // 카테고리: 지역별
    if (pathname === '/%EC%A7%80%EC%97%AD%EB%B3%84' || pathname === '/지역별') {
      return new Response(renderRegionList(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    // 카테고리: 특정 지역
    const regionMatch = decodeURIComponent(pathname).match(/^\/지역별\/(.+?)(?:\/(.+))?$/);
    if (regionMatch) {
      const region = regionMatch[1];
      if (REGIONS[region]) {
        const html = renderRegionDetail(region);
        if (html) return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    }
    
    // 카테고리: 과목별
    if (pathname === '/%EA%B3%BC%EB%AA%A9%EB%B3%84' || pathname === '/과목별') {
      return new Response(renderSubjectList(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    // 카테고리: 학교급별
    if (pathname === '/%ED%95%99%EA%B5%90%EA%B8%89%EB%B3%84' || pathname === '/학교급별') {
      return new Response(renderLevelList(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    // 콘텐츠 페이지
    const parsed = parseUrl(pathname);
    if (parsed) {
      const regionInfo = findRegion(parsed.location);
      if (regionInfo.valid) {
        const html = renderPage(parsed.location, parsed.level, parsed.subject, regionInfo.parentRegion, pathname);
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=86400',
          }
        });
      }
    }
    
    // 404
    return new Response(`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>페이지를 찾을 수 없습니다 | 안하니</title></head><body style="font-family:sans-serif;text-align:center;padding:100px 20px;"><h1>404</h1><p>요청하신 페이지를 찾을 수 없습니다.</p><a href="/">홈으로 돌아가기</a></body></html>`, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
};
