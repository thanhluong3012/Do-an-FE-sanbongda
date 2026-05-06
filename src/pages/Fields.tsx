import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Search, Clock, Building2, Image as ImageIcon } from 'lucide-react';
import { fieldComplexService, FieldComplex } from '@/services/fieldComplexService';
import { useToast } from '@/hooks/use-toast';

const Fields = () => {
  const { toast } = useToast();
  const [fieldComplexes, setFieldComplexes] = useState<FieldComplex[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Lấy danh sách district và field type động từ data thực
  const districts = useMemo(() => {
    const set = new Set<string>();
    fieldComplexes.forEach((c) => { if (c.district) set.add(c.district); });
    return Array.from(set).sort();
  }, [fieldComplexes]);

  const fieldTypes = useMemo(() => {
    const set = new Set<string>();
    fieldComplexes.forEach((c) => {
      c.fields?.forEach((f) => { if (f.field_type) set.add(f.field_type); });
    });
    return Array.from(set).sort();
  }, [fieldComplexes]);

  // Load field complexes từ API
  useEffect(() => {
    loadFieldComplexes();
  }, []);

  const loadFieldComplexes = async () => {
    try {
      setLoading(true);
      const data = await fieldComplexService.getAll();
      setFieldComplexes(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading field complexes:', error);
      setFieldComplexes([]);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách cụm sân. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredComplexes = fieldComplexes.filter((complex) => {
    if (!complex) return false;

    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (complex.name?.toLowerCase() || '').includes(q) ||
      (complex.address?.toLowerCase() || '').includes(q) ||
      (complex.district?.toLowerCase() || '').includes(q) ||
      (complex.city?.toLowerCase() || '').includes(q);

    const matchesDistrict = filterDistrict === 'all' ||
      (complex.district?.trim() === filterDistrict.trim());

    const matchesType = filterType === 'all' ||
      (complex.fields?.some((sf) => sf?.field_type === filterType) ?? false);

    return matchesSearch && matchesDistrict && matchesType;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Tìm Cụm Sân Bóng Đá</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tìm kiếm và đặt sân bóng đá từ các cụm sân uy tín, chất lượng cao
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Bộ lọc tìm kiếm</CardTitle>
                <CardDescription>Tìm sân phù hợp với bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tìm kiếm</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Tên sân, địa chỉ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Reset */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterDistrict('all');
                    setFilterType('all');
                  }}
                >
                  Đặt lại bộ lọc
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Field Complexes Grid */}
          <div className="lg:col-span-3">
            <div className="mb-4 text-muted-foreground">
              Tìm thấy <strong>{filteredComplexes.length}</strong> cụm sân
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Đang tải...</p>
                </div>
              </div>
            ) : filteredComplexes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredComplexes.map((complex) => (
                  <Card key={complex.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="relative h-48 bg-muted">
                      {complex.image ? (
                        <img
                          src={complex.image}
                          alt={complex.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const placeholder = parent.querySelector('.placeholder-icon');
                              if (placeholder) {
                                (placeholder as HTMLElement).style.display = 'flex';
                              }
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className="placeholder-icon absolute inset-0 flex items-center justify-center bg-muted"
                        style={{ display: complex.image ? 'none' : 'flex' }}
                      >
                        <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-green-500">
                          {complex.fields?.length || 0} sân
                        </Badge>
                      </div>
                    </div>
                    
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-xl">{complex.name}</CardTitle>
                      </div>
                      {complex.description && (
                        <CardDescription className="line-clamp-2">{complex.description}</CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{complex.address}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {(complex.open_time || complex.opening_time)?.substring(0, 5)} - {(complex.close_time || complex.closing_time)?.substring(0, 5)}
                        </span>
                      </div>

                      {/* Hiển thị loại sân có sẵn */}
                      <div className="flex flex-wrap gap-1 pt-2">
                        {complex.fields && [...new Set(complex.fields.map(sf => sf.field_type))].map((type) => (
                          <Badge key={type} variant="secondary" className="text-xs">
                            Sân {type} người
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="flex gap-2">
                      <Button className="flex-1" asChild>
                        <Link to={`/field-complex/${complex.id}`}>
                          Xem chi tiết & Đặt sân
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center">
                  <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Không tìm thấy cụm sân</h3>
                  <p className="text-muted-foreground mb-4">
                    Thử điều chỉnh bộ lọc hoặc tìm kiếm khác
                  </p>
                  <Button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterDistrict('all');
                      setFilterType('all');
                    }}
                  >
                    Đặt lại bộ lọc
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Fields;
