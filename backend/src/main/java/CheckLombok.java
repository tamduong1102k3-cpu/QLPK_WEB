import java.lang.reflect.Method;
public class CheckLombok {
    public static void main(String[] args) throws Exception {
        Class<?> clazz = Class.forName("com.qlpk.backend.entity.ChiSoKhamTongHop");
        for (Method m : clazz.getDeclaredMethods()) {
            if (m.getName().contains("MaPhieuKham")) {
                System.out.println(m.getName());
            }
        }
    }
}
