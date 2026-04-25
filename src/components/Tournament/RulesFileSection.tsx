import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { tournamentService, Tournament } from '@/services/tournamentService';
import { 
  FileText, Download, Upload, Trash2, Loader2, 
  CheckCircle, AlertCircle, Info 
} from 'lucide-react';

interface RulesFileSectionProps {
  tournament: Tournament;
  canEdit: boolean; // organizer hoặc admin
  onUpdate?: () => void;
}

export const RulesFileSection = ({ tournament, canEdit, onUpdate }: RulesFileSectionProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasFile = tournament.rules_file_info?.has_file;

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast({
        title: 'Lỗi',
        description: 'Chỉ hỗ trợ file PDF, DOC, DOCX',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast({
        title: 'Lỗi',
        description: 'File vượt quá 10MB. Vui lòng chọn file nhỏ hơn.',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    // Upload file
    setUploading(true);
    try {
      await tournamentService.uploadRulesFile(tournament.id, file);
      toast({
        title: 'Thành công',
        description: 'Upload file thể lệ thành công',
      });
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể upload file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async () => {
    toast({
      title: 'Đang tải...',
      description: 'Vui lòng đợi trong giây lát',
    });

    try {
      const blob = await tournamentService.downloadRulesFile(tournament.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Lấy tên file từ BE hoặc tạo tên mặc định
      const fileName = tournament.rules_file_info?.file_name || `the_le_${tournament.name.replace(/\s+/g, '_')}.pdf`;
      a.download = fileName;
      
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Thành công',
        description: `Đã tải file "${fileName}" về máy`,
      });
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể tải file. Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa file thể lệ này?')) return;

    setDeleting(true);
    try {
      await tournamentService.deleteRulesFile(tournament.id);
      toast({
        title: 'Thành công',
        description: 'Xóa file thể lệ thành công',
      });
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể xóa file',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Thể lệ giải đấu
        </CardTitle>
        <CardDescription>
          {hasFile 
            ? 'File thể lệ chi tiết của giải đấu (PDF/DOC/DOCX)'
            : 'Upload file thể lệ giải đấu để người tham gia dễ dàng xem và tải về'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Thông tin file nếu đã có */}
        {hasFile && tournament.rules_file_info && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Đã có file thể lệ</p>
                  <p className="text-xs mt-1 text-green-700">
                    {tournament.rules_file_info.file_name}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="ml-4"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Tải về
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Alert hướng dẫn nếu chưa có file */}
        {!hasFile && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <p className="font-medium mb-1">Lợi ích khi upload file thể lệ:</p>
              <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground">
                <li>Trình bày chuyên nghiệp với định dạng, hình ảnh, bảng biểu</li>
                <li>Người tham gia dễ dàng tải về và xem offline</li>
                <li>Thuận tiện cho việc in ấn và lưu trữ</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Định dạng: PDF, DOC, DOCX | Dung lượng tối đa: 10MB
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Nút upload/delete - chỉ cho organizer/admin */}
        {canEdit && (
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <Button
              onClick={handleFileSelect}
              disabled={uploading}
              variant={hasFile ? 'outline' : 'default'}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang upload...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {hasFile ? 'Thay đổi file' : 'Upload file thể lệ'}
                </>
              )}
            </Button>

            {hasFile && (
              <Button
                variant="destructive"
                size="icon"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        )}

        {/* Nút download cho user thường */}
        {!canEdit && hasFile && (
          <Button
            onClick={handleDownload}
            className="w-full"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Tải file thể lệ về máy
          </Button>
        )}

        {/* Thông báo nếu không có file và không có quyền edit */}
        {!canEdit && !hasFile && (
          <Alert>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <AlertDescription className="text-sm text-muted-foreground">
              Giải đấu này chưa có file thể lệ. Vui lòng xem phần mô tả hoặc liên hệ ban tổ chức.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
